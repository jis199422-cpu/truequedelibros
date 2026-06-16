import { getAvatarColor } from '../utils/avatarColor'

export function UserAvatar({ name, url, seed, size, className = '' }) {
  const { background, color } = getAvatarColor(seed ?? name)
  const sizeStyle = size ? { width: size, height: size, fontSize: size * 0.4 } : {}
  if (url) {
    return (
      <img
        className={`avatar ${className}`.trim()}
        style={size ? { width: size, height: size } : {}}
        src={url}
        alt={name}
      />
    )
  }
  return (
    <div
      className={`avatar-placeholder ${className}`.trim()}
      style={{ ...sizeStyle, background, color }}
    >
      {name?.charAt(0).toUpperCase() ?? '?'}
    </div>
  )
}
