import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'

const BUCKET = process.env.AWS_S3_BUCKET || 'trueque-de-libros-books-media'
const REGION = process.env.AWS_REGION || 'us-east-1'
const QUALITY = 82

const PREFIXES = {
  'books/': { maxWidth: 800, maxHeight: 1200 },
  'avatars/': { maxWidth: 500, maxHeight: 500 },
  'locales/': { maxWidth: 600, maxHeight: 600 },
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const dryRun = !apply
const onlyPrefix = args.find((a) => a.startsWith('--prefix='))?.split('=')[1]

if (!apply && !args.includes('--dry-run')) {
  console.log('No se pasó --dry-run ni --apply. Corriendo en modo --dry-run por defecto (no se escribe nada).\n')
}

const s3 = new S3Client({ region: REGION })

const streamToBuffer = async (stream) => {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const formatBytes = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`

async function* listAllKeys(prefix) {
  let continuationToken
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))
    for (const obj of res.Contents ?? []) yield obj
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)
}

async function resizeIfNeeded(buffer, contentType, limits) {
  const image = sharp(buffer)
  const meta = await image.metadata()
  const { width, height, format } = meta

  if (!width || !height || !format) {
    throw new Error(`No se pudo leer metadata de imagen (format=${format})`)
  }
  if (width <= limits.maxWidth && height <= limits.maxHeight) {
    return { changed: false, width, height, format }
  }

  let resized = image.resize({
    width: limits.maxWidth,
    height: limits.maxHeight,
    fit: 'inside',
    withoutEnlargement: true,
  })

  if (format === 'jpeg' || format === 'jpg') {
    resized = resized.jpeg({ quality: QUALITY })
  } else if (format === 'png') {
    resized = resized.png({ quality: QUALITY })
  } else if (format === 'webp') {
    resized = resized.webp({ quality: QUALITY })
  }
  // otros formatos: resize sin recodificación específica, sharp mantiene el formato de entrada

  const outBuffer = await resized.toBuffer()
  return { changed: true, buffer: outBuffer, width, height, format }
}

async function processKey(key, limits, stats) {
  const got = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const buffer = await streamToBuffer(got.Body)
  const contentType = got.ContentType

  let result
  try {
    result = await resizeIfNeeded(buffer, contentType, limits)
  } catch (err) {
    stats.errors.push({ key, message: err.message })
    console.log(`  [ERROR] ${key}: ${err.message}`)
    return
  }

  stats.totalBefore += buffer.length

  if (!result.changed) {
    stats.skipped += 1
    stats.totalAfter += buffer.length
    console.log(`  [skip] ${key} (${result.width}x${result.height}, ya dentro del límite)`)
    return
  }

  stats.resized += 1
  stats.totalAfter += result.buffer.length
  const savingPct = (100 * (1 - result.buffer.length / buffer.length)).toFixed(1)
  console.log(`  [resize] ${key} ${result.width}x${result.height} ${formatBytes(buffer.length)} -> ${formatBytes(result.buffer.length)} (-${savingPct}%)`)

  if (apply) {
    await s3.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${encodeURIComponent(key)}`,
      Key: `backup/${key}`,
    }))
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: result.buffer,
      ContentType: contentType,
    }))
  }
}

async function main() {
  console.log(`Bucket: ${BUCKET} (${REGION})`)
  console.log(`Modo: ${apply ? 'APPLY (backup + overwrite real)' : 'DRY-RUN (no se escribe nada)'}\n`)

  const overall = { totalBefore: 0, totalAfter: 0, skipped: 0, resized: 0, errors: [] }

  for (const [prefix, limits] of Object.entries(PREFIXES)) {
    if (onlyPrefix && prefix !== `${onlyPrefix}/`) continue
    console.log(`--- ${prefix} (max ${limits.maxWidth}x${limits.maxHeight}) ---`)
    const stats = { totalBefore: 0, totalAfter: 0, skipped: 0, resized: 0, errors: [] }

    for await (const obj of listAllKeys(prefix)) {
      if (obj.Key.startsWith('backup/') || obj.Key.startsWith(`backup/${prefix}`)) continue
      if (obj.Key.endsWith('/')) continue
      await processKey(obj.Key, limits, stats)
    }

    console.log(`  Subtotal ${prefix}: ${stats.resized} redimensionadas, ${stats.skipped} sin cambios, ${stats.errors.length} errores`)
    console.log(`  ${formatBytes(stats.totalBefore)} -> ${formatBytes(stats.totalAfter)}\n`)

    overall.totalBefore += stats.totalBefore
    overall.totalAfter += stats.totalAfter
    overall.skipped += stats.skipped
    overall.resized += stats.resized
    overall.errors.push(...stats.errors)
  }

  console.log('=== Resumen total ===')
  console.log(`Redimensionadas: ${overall.resized}`)
  console.log(`Sin cambios: ${overall.skipped}`)
  console.log(`Errores: ${overall.errors.length}`)
  console.log(`Tamaño total: ${formatBytes(overall.totalBefore)} -> ${formatBytes(overall.totalAfter)}`)
  if (overall.totalBefore > 0) {
    console.log(`Ahorro: ${(100 * (1 - overall.totalAfter / overall.totalBefore)).toFixed(1)}%`)
  }
  if (overall.errors.length) {
    console.log('\nErrores detallados:')
    for (const e of overall.errors) console.log(`  - ${e.key}: ${e.message}`)
  }
  if (dryRun) {
    console.log('\nEsto fue un DRY-RUN: no se modificó nada en S3. Corré con --apply para aplicar los cambios (con backup previo en backup/).')
  }
}

main().catch((err) => {
  console.error('Fallo inesperado:', err)
  process.exit(1)
})
