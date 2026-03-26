import TableModule from 'quill/modules/table.js'

let registered = false

/** Registers Quill 2 table blots (TableCell / TableRow / TableBody / TableContainer). Safe to call multiple times. */
export function registerQuillTableFormats(): void {
  if (registered) return
  TableModule.register()
  registered = true
}
