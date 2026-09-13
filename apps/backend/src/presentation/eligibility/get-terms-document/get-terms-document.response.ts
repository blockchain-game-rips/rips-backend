// The terms document is a PDF, so the route advertises that concretely rather
// than as opaque bytes — the bot hands the response to Telegram as a document
// and the filename is what a user sees in the chat.
export const TERMS_CONTENT_TYPE = 'application/pdf'

export const TERMS_FILENAME = 'terms.pdf'

export const TERMS_CONTENT_DISPOSITION = `attachment; filename="${TERMS_FILENAME}"`
