import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { ffprobe } from 'fluent-ffmpeg'
import { FfmpegCommand as FFMpegCommand } from 'fluent-ffmpeg'
import { FfprobeData as FFProbeData } from 'fluent-ffmpeg'
import { ScreenshotsConfig } from 'fluent-ffmpeg'

/**
 * @interface GenerateVideoThumbnailOptions
 * @since 1.0.0
 */
export interface GenerateVideoThumbnailOptions {
	width?: number
	height?: number
}

/**
 * @function generateVideoThumbnail
 * @since 1.0.0
 */
export async function generateVideoThumbnail(src: string, dst: string, options: GenerateVideoThumbnailOptions) {

	let dir = path.dirname(src)
	let ext = path.extname(src)
	let lbl = path.basename(src, ext)

	let meta = await getVideoMetadata(src)

	let w = meta.width
	let h = meta.height

	if (w == null ||
		h == null) {
		return null
	}

	let {
		dw,
		dh
	} = resize(
		w, h,
		options.width,
		options.height
	)

	lbl = [lbl, '@', dw, 'x', dh, '.jpg'].join('')

	dst = path.join(
		dst,
		lbl
	)

	await screenshot(src, {
		count: 1,
		folder: dir,
		filename: lbl,
		timemarks: [3]
	})

	return dst
}

/**
 * @method getVideoMetadata
 * @since 1.0.0
 * @hidden
 */
async function getVideoMetadata(video: string) {

	let width: number | undefined
	let height: number | undefined
	let length: number | undefined

	let meta = await probe(video)
	if (meta &&
		meta.streams[0]) {
		width = meta.streams[0].width
		height = meta.streams[0].height
		length = meta.streams[0].length
	}

	return {
		width,
		height,
		length
	}
}

/**
 * @function resize
 * @since 1.0.0
 * @hidden
 */
function resize(srcW: number, srcH: number, dstW?: number, dstH?: number) {

	if (dstW != null &&
		dstH != null) {

		dstW = Math.ceil(dstW)
		dstH = Math.ceil(dstH)

	} else if (dstW) {

		dstH = Math.ceil(dstW * (srcH / srcW))

	} else if (dstH) {

		dstW = Math.ceil(dstH * (srcW / srcH))

	}

	return {
		dw: dstW,
		dh: dstH
	}
}

/**
 * @function resize
 * @since 1.0.0
 * @hidden
 */
async function probe(source: string) {
	return new Promise<FFProbeData>((success, failure) => {
		ffprobe(source, (err, res) => err ? failure(err) : success(res))
	})
}

/**
 * @function screenshot
 * @since 1.0.0
 * @hidden
 */
async function screenshot(source: string, options: ScreenshotsConfig) {
	return new Promise<FFMpegCommand>((success, failure) => {
		ffmpeg(source).screenshot(options).on('error', failure).on('end', success)
	})
}