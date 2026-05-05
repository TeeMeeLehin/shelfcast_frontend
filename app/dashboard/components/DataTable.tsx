export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: TableColumn<T>[];
  rows: T[];
}

export default function DataTable<T extends Record<string, unknown>>({ columns, rows }: DataTableProps<T>) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} style={{ background: "#d8edc7", border: "1px solid #d4dec4", padding: "14px 16px", textAlign: col.align ?? "left", fontSize: 13, fontWeight: 600, color: "#000" }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col.key} style={{ border: "1px solid #d4dec4", padding: "14px 16px", textAlign: col.align ?? "left", fontSize: 13, fontWeight: 500, color: "#000" }}>
                {col.render ? col.render(row) : String(row[col.key] ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
