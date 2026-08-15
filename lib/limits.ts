export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_ATTACHMENT_TEXT_LENGTH = 50_000
export const MAX_MESSAGE_LENGTH = 20_000
export const MAX_CONTENT_PART_TEXT_LENGTH = 50_000
export const MAX_IMAGE_PROMPT_LENGTH = 4_000
export const MAX_MESSAGES = 200
export const MAX_CONTENT_PARTS = 100

// A 10 MB binary image expands to just under 14 MB when encoded as a data URL.
// Keep the API limit aligned with the attachment limit used by the client.
export const MAX_IMAGE_URL_LENGTH = 14_000_000
