import { useState, useCallback } from "react";
import { AppTable } from "@components/index.js";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Mail, 
  Printer,
  Archive,
  Tag
} from "lucide-react";

const Test = () => {
  const [data, setData] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "Inactive" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User", status: "Active" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "Admin", status: "Inactive" },
    { id: 6, name: "Diana Martinez", email: "diana@example.com", role: "Editor", status: "Active" },
    { id: 7, name: "Edward Lee", email: "edward@example.com", role: "User", status: "Active" },
    { id: 8, name: "Fiona Clark", email: "fiona@example.com", role: "User", status: "Inactive" },
    { id: 9, name: "George Harris", email: "george@example.com", role: "Editor", status: "Active" },
    { id: 10, name: "Helen Turner", email: "helen@example.com", role: "Admin", status: "Active" },
    { id: 11, name: "Ian Phillips", email: "ian@example.com", role: "User", status: "Inactive" },
    { id: 12, name: "Julia Evans", email: "julia@example.com", role: "Editor", status: "Active" },
  ]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchVal, setSearchVal] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      item.email.toLowerCase().includes(searchVal.toLowerCase()) ||
      item.role.toLowerCase().includes(searchVal.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const count = Math.ceil(filteredData.length / rowsPerPage);

  const handleSearchChange = useCallback((e) => {
    setSearchVal(e.target.value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((row) => {
    console.log("Row clicked:", row);
  }, []);

  const handleAddNew = useCallback(() => {
    const newId = Math.max(...data.map((d) => d.id)) + 1;
    setData([
      ...data,
      {
        id: newId,
        name: `New User ${newId}`,
        email: `user${newId}@example.com`,
        role: "User",
        status: "Active",
      },
    ]);
    console.log("Add new item");
  }, [data]);

  const handleEdit = useCallback(() => {
    console.log("Edit selected:", selectedRows);
  }, [selectedRows]);

  const handleDelete = useCallback(() => {
    setData(data.filter((item) => !selectedRows.includes(item.id)));
    setSelectedRows([]);
    console.log("Delete selected:", selectedRows);
  }, [data, selectedRows]);

  const handleDownload = useCallback(() => {
    console.log("Download selected:", selectedRows);
  }, [selectedRows]);

  const handleSendEmail = useCallback(() => {
    console.log("Send email to selected:", selectedRows);
  }, [selectedRows]);

  const handlePrint = useCallback(() => {
    console.log("Print selected:", selectedRows);
  }, [selectedRows]);

  const handleArchive = useCallback(() => {
    console.log("Archive selected:", selectedRows);
    setSelectedRows([]);
  }, [selectedRows]);

  const handleTag = useCallback(() => {
    console.log("Tag selected:", selectedRows);
  }, [selectedRows]);

  // Regular actions (akan selalu terlihat di header)
  const regularActions = [
    {
      icon: Plus,
      label: "Tambah Baru",
      onClick: handleAddNew,
      color: "primary",
    },
    {
      icon: Edit,
      label: "Edit",
      onClick: handleEdit,
      disabled: selectedRows.length !== 1, // Hanya enable jika 1 baris dipilih
    },
  ];

  // Bulk actions (hanya muncul saat ada baris yang dipilih)
  const bulkActions = [
    {
      icon: Trash2,
      label: "Hapus",
      onClick: handleDelete,
      color: "error",
      isBulkAction: true,
    },
    {
      icon: Download,
      label: "Download",
      onClick: handleDownload,
      isBulkAction: true,
    },
    {
      icon: Mail,
      label: "Kirim Email",
      onClick: handleSendEmail,
      isBulkAction: true,
    },
    {
      icon: Printer,
      label: "Cetak",
      onClick: handlePrint,
      isBulkAction: true,
    },
    {
      icon: Archive,
      label: "Arsipkan",
      onClick: handleArchive,
      isBulkAction: true,
    },
    {
      icon: Tag,
      label: "Tag",
      onClick: handleTag,
      isBulkAction: true,
    },
  ];

  const headers = ["Nama", "Email", "Role", "Status"];

  const renderRow = (row) => [
    <strong key="name">{row.name}</strong>,
    row.email,
    <span
      key="role"
      style={{
        padding: "2px 8px",
        borderRadius: "12px",
        backgroundColor:
          row.role === "Admin"
            ? "#e3f2fd"
            : row.role === "Editor"
            ? "#f3e5f5"
            : "#e8f5e9",
        color:
          row.role === "Admin"
            ? "#1565c0"
            : row.role === "Editor"
            ? "#7b1fa2"
            : "#2e7d32",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {row.role}
    </span>,
    <span
      key="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: row.status === "Active" ? "#2e7d32" : "#d32f2f",
        fontSize: "0.875rem",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: row.status === "Active" ? "#4caf50" : "#f44336",
          display: "inline-block",
        }}
      />
      {row.status}
    </span>,
  ];

  return (
    <div style={{ padding: "24px" }}>
      <AppTable
        title="Manajemen Pengguna"
        subtitle="Kelola data pengguna sistem"
        data={paginatedData}
        headers={headers}
        renderRow={renderRow}
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSearchChange={handleSearchChange}
        searchVal={searchVal}
        searchPlaceholder="Cari pengguna..."
        onRowClick={handleRowClick}
        actions={[...regularActions, ...bulkActions]}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        isLoading={false}
        minWidth={800}
        emptyStateMessage="Tidak ada pengguna ditemukan"
      />
    </div>
  );
};

export default Test;