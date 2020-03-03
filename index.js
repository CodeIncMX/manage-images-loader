const fs = require('fs')
const loaderUtils = require('loader-utils')
const imagemin = require('imagemin')
const webp = require('imagemin-webp')
const sizeOf = require('image-size')
const resizeImg = require('resize-img')
const GREEN = '\x1b[32m%s\x1b[0m'
const RED = '\x1b[31m%s\x1b[0m'
const YELLOW = '\x1b[36m%s\x1b[0m'

module.exports = async function (content) {
  const fileName = loaderUtils.interpolateName(this, "[name].[ext]", { content })
  const path = loaderUtils.interpolateName(this, "[path][name].[ext]", { content })
  const buffer = await fs.readFileSync(path)

  await create1XSizeVersion({ path, fileName } )
  await createWebpVersion(this, { buffer, path, fileName })

  return content
}

async function create1XSizeVersion( originalImg, postfix = "@2x") {
  if(originalImg.fileName.includes(postfix)) {
    const normalSizeFilePath = originalImg.path.replace(postfix,"")
    const normalSizeFileName = originalImg.fileName.replace(postfix,"")

    if(fs.existsSync(normalSizeFilePath)) {
      console.log(YELLOW, `1X SIZE IMAGE FILE NOT CREATED FROM ${originalImg.fileName} BECAUSE ${normalSizeFileName} IMAGE ALREADY EXISTS!!!`)
      return
    }

    const img1xDimensions = await calculate1xImgDimension(originalImg.path)
    const buffer = await resizeImg(fs.readFileSync(originalImg.path), img1xDimensions)

    fs.writeFileSync(normalSizeFilePath, buffer);
    console.log(GREEN, `1X SIZE ${normalSizeFileName} CREATED SUCCESSFULLY`)
  }
}

async function calculate1xImgDimension(imgPath){
  const dimensions = await sizeOf(imgPath)
  return newDimension = {
    width: dimensions.width / 2,
    height: dimensions.height / 2
  }
}

async function createWebpVersion(context, originalImg){
  const options = loaderUtils.getOptions(context)
  const webpImgBuffer = await reduceAndTransformFile(originalImg.buffer, options)
  const webpFilePath = interchangeExt(originalImg.path)

  if (fs.existsSync(webpFilePath)){
    console.log(YELLOW, `WEBP IMAGE NOT CREATED FROM ${originalImg.fileName} BECAUSE WEBP VERSION FILE ALREADY EXISTS!!!`)
    return
  }

  fs.writeFileSync(webpFilePath, webpImgBuffer)
  showWebStats(originalImg.buffer, webpImgBuffer, originalImg.fileName)
}

function interchangeExt(fileName){
  return `${fileName.split('.').slice(0,-1).join('.')}.webp`
}

async function reduceAndTransformFile(originalImgBuffer, options) {
  const plugins = [ webp(options) ]
  const webpImgBuffer = await imagemin.buffer(originalImgBuffer, { plugins })
  return webpImgBuffer;
}

function showWebStats(originalImgBuffer, webpImgBuffer, fileName) {
  const savedKB = (originalImgBuffer.length - webpImgBuffer.length) / 1000;
  console.log(GREEN, `${savedKB.toFixed(1)} KB SAVED FROM[ ${fileName} ] SUCCESSFULLY CONVERTED TO webp FORMAT`);
}