# Maintenance document framework

## Navigation

- Overview: personnel, vehicle and generator totals, organization summary and expiry reminders.
- Personnel management: personnel records.
- Asset management: vehicle management and generator management.
- Document management: source files, recognition jobs, review and associations.

## Current implementation

The overview reads all pages of the existing three list APIs. The document workspace
is an explicitly marked UI scaffold. Selected files are held only in memory and
are not uploaded, persisted, recognized or associated. No OCR results are simulated.
The expiry panel consumes an optional expirations array; existing APIs do not yet
persist that array, so reminders require the document backend described below.

## Persistence boundaries

1. Documents store original file metadata, checksum, uploader and a private storage key.
2. Recognition jobs store provider, execution status, errors and retries.
3. Recognition results retain original text, extracted fields and confidence values.
4. Document links associate a document with one or more personnel or asset records.
5. Confirmations retain corrected fields, reviewer, review time and validity dates.
6. Reminders reference confirmed validity dates and the associated record.

Use the document-contracts.ts interfaces as initial API contracts. Original files
must remain on private storage. Authorized download APIs resolve storage keys;
public static URLs must not expose identity documents. Apply the business account
guard and record-level scope checks to upload, review, download and association.
Do not log identity numbers, OCR text or file contents.

## Processing flow

Upload -> queued -> recognizing -> needs_review -> confirmed.
Failures retain the original document and a retryable task state. The frontend
must distinguish a selected local file from a persisted upload.

The recognizer proposes identity, vehicle plate and other matches. Ambiguous
matches require manual selection. Recognition never silently overwrites an
existing personnel or asset record. Confirmation commits links, corrected fields
and reminders atomically and writes an audit event. Expiry dates use calendar
dates in Asia/Shanghai; permanent documents explicitly have no expiry.

## Planned API surface

- POST /api/biz/maintenance/documents: multipart upload.
- GET /api/biz/maintenance/documents: paginated document list and processing status.
- GET /api/biz/maintenance/documents/:id: metadata and recognition results.
- GET /api/biz/maintenance/documents/:id/download: authorized original download.
- POST /api/biz/maintenance/documents/:id/recognize: enqueue or retry recognition.
- POST /api/biz/maintenance/documents/:id/confirm: review and associate.
- GET /api/biz/maintenance/overview: server aggregates and reminder counts.
- GET /api/biz/maintenance/reminders: paginated upcoming and overdue reminders.

These endpoints are planned contracts, not currently implemented endpoints.
Before implementation, select the private storage adapter and OCR provider,
define allowed formats and size limits, and add migrations for the entities above.
