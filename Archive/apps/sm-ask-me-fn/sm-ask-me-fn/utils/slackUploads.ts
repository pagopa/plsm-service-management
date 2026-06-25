import { WebClient, FilesGetUploadURLExternalResponse } from '@slack/web-api'

export const getFileName = (product: string) => {
  return `${product}_users.xlsx`
}

export const getURL =
  (client: WebClient) =>
    async (
      fileName: string,
      fileSize: number,
      altText: string,
    ): Promise<FilesGetUploadURLExternalResponse> => {
      return client.files.getUploadURLExternal({
        length: fileSize,
        filename: fileName,
        alt_text: altText,
      })
    }

export const uploadXLSX = async (uploadUrl: string, file: Buffer) => {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: new Uint8Array(file),
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  })
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`)
  }

  return response
}

export const completeUpload =
  (client: WebClient) =>
    (channelId: string, fileName: string, fileId: string) => {
      return client.files.completeUploadExternal({
        files: [
          {
            id: fileId,
            title: fileName,
          },
        ],
        channel_id: channelId,
      })
    }
