import { S3 } from 'aws-sdk'

const S3Client = new S3()

/* Responds to submissions table insert event - mock anti-virus scan */
export const handler = async (event, context) => {
  // Get attributes from event detail
  const { filename } = event.detail.newImage
  const regex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}-\w+-(pass|fail).\w*/

  // Mock antivirus scan based on filename
  const [, avScanResult] = filename.match(regex)
  const avScanPass = avScanResult === 'pass'

  // Determine destination S3 bucket for file based on AV scan result
  const destinationBucket = avScanPass ? process.env.SUBMISSIONS_BUCKET : process.env.SUBMISSIONS_QUARANTINE_BUCKET

  // Move file to destination bucket
  await S3Client.copyObject({
    Bucket: destinationBucket,
    CopySource: encodeURI(`/${process.env.SUBMISSIONS_DMZ_BUCKET}/${filename}`),
    Key: filename
  }).promise()
  await S3Client.deleteObject({
    Bucket: process.env.SUBMISSIONS_DMZ_BUCKET,
    Key: filename
  }).promise()
}
