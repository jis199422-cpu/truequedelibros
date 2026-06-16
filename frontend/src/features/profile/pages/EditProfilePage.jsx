import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import { updateProfile, getAvatarUploadUrl, uploadToS3 } from '../../../shared/api/users.api'
import { Button } from '../../../shared/components/Button'
import { Input } from '../../../shared/components/Input'
import { Spinner } from '../../../shared/components/Spinner'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function EditProfilePage() {
  const navigate = useNavigate()
  const { user, setAuth } = useAuthStore()
  const accessToken = useAuthStore((s) => s.accessToken)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    profilePictureUrl: user?.profilePictureUrl ?? '',
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePictureUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }

    setUploading(true)
    try {
      const { data } = await getAvatarUploadUrl({ fileName: file.name, contentType: file.type })
      await uploadToS3(data.uploadUrl, file)
      setForm((prev) => ({ ...prev, profilePictureUrl: data.imageUrl }))
      setAvatarPreview(URL.createObjectURL(file))
      toast.success('Foto actualizada')
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateProfile(form)
      setAuth(accessToken, data)
      toast.success('Perfil actualizado')
      navigate(`/profile/me`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-page">
      <div className="edit-page-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar perfil</h1>
      </div>

      <div className="avatar-upload" onClick={handleAvatarClick} role="button" tabIndex={0}
           onKeyDown={(e) => e.key === 'Enter' && handleAvatarClick()}>
        {uploading ? (
          <div className="avatar-placeholder"><Spinner size="md" /></div>
        ) : avatarPreview ? (
          <img className="avatar" src={avatarPreview} alt="Avatar" />
        ) : (
          <UserAvatar name={user?.name} seed={user?.name} />
        )}
        <span className="avatar-upload-hint">Cambiar foto</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <Input
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tu nombre"
        />

        <div className="form-field">
          <label className="form-label">Bio</label>
          <textarea
            className="form-textarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Cuéntanos algo sobre ti y tus gustos literarios..."
            maxLength={500}
          />
        </div>

        <Button type="submit" loading={saving}>
          Guardar cambios
        </Button>
      </form>
    </div>
  )
}
