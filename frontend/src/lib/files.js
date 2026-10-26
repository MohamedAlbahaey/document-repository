export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, same as the API
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'];
export const ACCEPT = ALLOWED_EXTENSIONS.join(',');

// Returns an error message, or '' if the file is fine
export function validateFile(file) {
  if (!file) return 'Please choose a file';

  const dot = file.name.lastIndexOf('.');
  const extension = dot === -1 ? '' : file.name.slice(dot).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'File type not allowed. Allowed: PDF, DOCX, XLSX, TXT, PNG, JPG';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large (max 10 MB)';
  }
  return '';
}