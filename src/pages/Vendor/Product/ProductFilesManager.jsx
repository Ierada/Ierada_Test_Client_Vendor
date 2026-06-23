import React, { useState, useEffect, useMemo } from "react";
import {
  useTable,
  usePagination,
  useGlobalFilter,
  useSortBy,
} from "react-table";
import {
  FiUpload,
  FiTrash2,
  FiCopy,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiImage,
  FiVideo,
  FiArrowUp,
  FiArrowDown,
  FiFilter,
  FiX,
} from "react-icons/fi";
import {
  listAllFiles,
  uploadBulkFiles,
  deleteFile,
  bulkDeleteFiles,
} from "../../../services/api.product";
import {
  notifyOnSuccess,
  notifyOnFail,
} from "../../../utils/notification/toast";
import BulkProductImport from "../../../components/Vendor/Models/BulkProductImport";
import { FiPackage } from "react-icons/fi";
import { useAppContext } from "../../../context/AppContext";

const chunkArray = (array, size) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size)
  );

const ProductFilesManager = () => {
  const { user } = useAppContext();
  const vendorId = user?.role === "vendor" ? user?.id : null;
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    id: "created_at",
    desc: true,
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    product_id: "",
    variation_id: "",
    vendor_id: vendorId || "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const toggleBulkImport = () => {
    setShowBulkImport(!showBulkImport);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      product_id: "",
      variation_id: "",
      vendor_id: vendorId || "",
    });
  };

  const handleRowSelect = (filename) => {
    setSelectedRows((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleSelectAll = (page) => {
    if (selectedRows.length === page.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(page.map((row) => row.original.file));
    }
  };

  const handleBulkDelete = async () => {
    setShowConfirmDialog(false);
    try {
      const response = await bulkDeleteFiles(selectedRows);
      if (response.status === 1) {
        notifyOnSuccess(response.message);
        setSelectedRows([]);
        loadFiles(pageIndex + 1);
      } else {
        notifyOnFail(response.message || "Error deleting files");
      }
    } catch (error) {
      notifyOnFail("Failed to delete files. Please try again.");
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Select",
        accessor: "select",
        disableSortBy: true,
        Cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.original.file)}
            onChange={() => handleRowSelect(row.original.file)}
            className="h-4 w-4"
          />
        ),
      },
      {
        Header: "Preview",
        accessor: "file_url",
        disableSortBy: true,
        Cell: ({ row }) => (
          <div className="w-14 h-14 flex items-center justify-center">
            {row.original.type === "image" ? (
              <img
                src={row.original.file_url}
                alt={row.original.file}
                className="max-h-14 max-w-14 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-md">
                <FiVideo className="text-gray-500 text-xl" />
              </div>
            )}
          </div>
        ),
      },
      {
        Header: "Type",
        accessor: "type",
        Cell: ({ value }) => (
          <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
            {value}
          </span>
        ),
      },
      {
        Header: "Filename",
        accessor: "file",
        Cell: ({ value }) => (
          <div className="flex items-center">
            <span className="mr-2 truncate max-w-xs">{value}</span>
            <button
              onClick={() => handleCopyFilename(value)}
              className="text-gray-400 hover:text-blue-500"
              title="Copy filename"
            >
              <FiCopy size={14} />
            </button>
          </div>
        ),
      },
      {
        Header: "Original Name",
        accessor: "original_filename",
        Cell: ({ value }) => <div className="truncate max-w-xs">{value}</div>,
      },
      {
        Header: "Date",
        accessor: "created_at",
        Cell: ({ value }) => new Date(value).toLocaleDateString(),
      },
      {
        Header: "Actions",
        disableSortBy: true,
        Cell: ({ row }) => (
          <button
            onClick={() => handleDeleteFile(row.original.file)}
            className="text-red-500 hover:text-red-700"
            title="Delete file"
          >
            <FiTrash2 />
          </button>
        ),
      },
    ],
    [selectedRows]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount: reactTablePageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: files,
      manualPagination: true,
      manualSortBy: true,
      autoResetPage: false,
      autoResetSortBy: false,
      pageCount,
      disableSortRemove: true,
      initialState: {
        pageIndex: 0,
        pageSize: 50,
        sortBy: [
          {
            id: sortConfig.id,
            desc: sortConfig.desc,
          },
        ],
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Handle sorting changes
  const handleSort = (column) => {
    if (column.disableSortBy) return;

    const isDesc = sortConfig.id === column.id ? !sortConfig.desc : false;
    setSortConfig({
      id: column.id,
      desc: isDesc,
    });

    gotoPage(0);
  };

  const loadFiles = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await listAllFiles({
        page,
        limit: pageSize,
        search: debouncedSearchTerm,
        sortBy: sortConfig.id,
        sortOrder: sortConfig.desc ? "desc" : "asc",
        product_id: filters.product_id || undefined,
        variation_id: filters.variation_id || undefined,
        vendor_id: vendorId || undefined,
      });

      if (response.status === 1) {
        setFiles(response.data.images);
        setPageCount(response.data.pagination.totalPages);
        setTotalFiles(response.data.pagination.total);
      } else {
        notifyOnFail("Failed to load files");
      }
    } catch (error) {
      console.error("Error loading files:", error);
      notifyOnFail("Failed to load files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reload files when page, pageSize, search term, or sort config changes
  useEffect(() => {
    const currentPage = pageIndex + 1;
    loadFiles(currentPage);
  }, [pageIndex, pageSize, debouncedSearchTerm, sortConfig, filters]);

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      notifyOnFail("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setShowUploadModal(true);
    setUploadProgress(0);
    const chunkSize = 100;
    const fileChunks = chunkArray(selectedFiles, chunkSize);
    let uploadedCount = 0;
    let failedCount = 0;
    let allDuplicateFiles = [];

    try {
      for (let i = 0; i < fileChunks.length; i++) {
        const chunk = fileChunks[i];
        const formData = new FormData();
        chunk.forEach((file) => formData.append("files", file));

        if (filters.vendor_id) {
          formData.append("vendor_id", filters.vendor_id);
        }
        if (filters.product_id) {
          formData.append("product_id", filters.product_id);
        }
        if (filters.variation_id) {
          formData.append("variation_id", filters.variation_id);
        }

        const response = await uploadBulkFiles(formData);

        if (response.status === 1) {
          uploadedCount += response.data.uploadedFiles?.length || 0;
          failedCount += response.data.failedFiles?.length || 0;
          if (response.data.failedFiles?.length > 0) {
            const duplicates = response.data.failedFiles.filter((f) =>
              f.error?.includes("Duplicate file")
            );
            allDuplicateFiles = [...allDuplicateFiles, ...duplicates];
          }
        } else {
          notifyOnFail(response.message || "Error uploading files in batch");
          setShowUploadModal(false);
          setIsUploading(false);
          return;
        }

        // Update progress after each chunk
        setUploadProgress(((i + 1) / fileChunks.length) * 100);
      }

      if (allDuplicateFiles.length > 0) {
        setDuplicateFiles(allDuplicateFiles);
        setShowDuplicates(true);
      }

      notifyOnSuccess(
        `Uploaded ${uploadedCount} files${
          failedCount > 0 ? ` (${failedCount} failed)` : ""
        }`
      );

      setSelectedFiles([]);
      loadFiles(1);
      gotoPage(0);
    } catch (error) {
      console.error("Error during batch upload:", error);
      notifyOnFail("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
      setShowUploadModal(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        const response = await deleteFile(filename);

        if (response.status === 1) {
          notifyOnSuccess("File deleted successfully");
          loadFiles(pageIndex + 1);
        } else {
          notifyOnFail(response.message || "Error deleting file");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        notifyOnFail("Failed to delete file. Please try again.");
      }
    }
  };

  const handleCopyFilename = (filename) => {
    navigator.clipboard.writeText(filename);
    notifyOnSuccess("Filename copied to clipboard");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Bulk Products & Files</h2>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              <FiUpload className="mr-2" />
              <span>Select Files</span>
            </label>

            <button
              onClick={handleBulkUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className={`flex items-center px-4 py-2 rounded-md ${
                selectedFiles.length === 0 || isUploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <span>
                  Upload{" "}
                  {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
                </span>
              )}
            </button>

            {selectedRows.length > 0 && (
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FiTrash2 className="mr-2" />
                <span>Delete Selected ({selectedRows.length})</span>
              </button>
            )}

            <button
              onClick={toggleBulkImport}
              className={`flex items-center px-4 py-2 rounded-md ${
                showBulkImport
                  ? "bg-indigo-700 text-white"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              <FiPackage className="mr-2" />
              <span>Bulk Product Import</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="border border-gray-200 rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Filter Files</h3>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="product_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product ID
                </label>
                <input
                  type="text"
                  id="product_id"
                  name="product_id"
                  value={filters.product_id}
                  onChange={handleFilterChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by Product ID"
                />
              </div>
              <div>
                <label
                  htmlFor="variation_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Variation ID
                </label>
                <input
                  type="text"
                  id="variation_id"
                  name="variation_id"
                  value={filters.variation_id}
                  onChange={handleFilterChange}
                  className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by Variation ID"
                />
              </div>
              {!vendorId && (
                <div>
                  <label
                    htmlFor="vendor_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Vendor ID
                  </label>
                  <input
                    type="text"
                    id="vendor_id"
                    name="vendor_id"
                    value={filters.vendor_id}
                    onChange={handleFilterChange}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filter by Vendor ID"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="border border-gray-200 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected files:
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles?.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs"
                >
                  {file.type.startsWith("image/") ? (
                    <FiImage className="mr-1" />
                  ) : (
                    <FiVideo className="mr-1" />
                  )}
                  <span className="truncate max-w-xs">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDuplicates && duplicateFiles.length > 0 && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-md p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-yellow-700">
                {duplicateFiles.length} file(s) were not uploaded because they
                are duplicates. Please rename them and try again.
              </p>
              <button
                onClick={() => setShowDuplicates(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {duplicateFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-yellow-100 rounded-full px-3 py-1 text-xs"
                >
                  <FiImage className="mr-1 text-yellow-700" />
                  <span className="truncate max-w-xs text-yellow-800">
                    {file.originalName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showBulkImport && (
          <div className="mb-8 mt-6 border-t border-gray-200 pt-6">
            <div className="bg-gray-50 rounded-lg">
              <BulkProductImport vendorId={filters.vendor_id || vendorId} />
            </div>
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Bulk Delete
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {selectedRows.length} selected
              file(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div>Loading...</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table
              {...getTableProps()}
              className="min-w-full divide-y divide-gray-200"
            >
              <thead className="bg-gray-50">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps()}
                        onClick={() => handleSort(column)}
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.disableSortBy
                            ? ""
                            : "cursor-pointer hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center">
                          {column.id === "select" ? (
                            <input
                              type="checkbox"
                              checked={
                                selectedRows.length === page.length &&
                                page.length > 0
                              }
                              onChange={() => handleSelectAll(page)}
                              className="h-4 w-4"
                            />
                          ) : (
                            <>
                              {column.render("Header")}
                              {!column.disableSortBy && (
                                <span className="ml-1">
                                  {sortConfig.id === column.id ? (
                                    sortConfig.desc ? (
                                      <FiArrowDown className="inline" />
                                    ) : (
                                      <FiArrowUp className="inline" />
                                    )
                                  ) : (
                                    <span className="opacity-0">▲</span>
                                  )}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                {...getTableBodyProps()}
                className="bg-white divide-y divide-gray-200"
              >
                {page.length > 0 ? (
                  page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} className="hover:bg-gray-50">
                        {row.cells.map((cell) => (
                          <td
                            {...cell.getCellProps()}
                            className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"
                          >
                            {cell.render("Cell")}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No files found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {page.length > 0 ? pageIndex * pageSize + 1 : 0} to{" "}
              {Math.min((pageIndex + 1) * pageSize, totalFiles)} of {totalFiles}{" "}
              files
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  gotoPage(0);
                }}
                disabled={!canPreviousPage}
                className={`p-1 rounded ${
                  !canPreviousPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Go to first page"
              >
                <FiChevronsLeft size={20} />
              </button>

              <button
                onClick={() => {
                  previousPage();
                }}
                disabled={!canPreviousPage}
                className={`p-1 rounded ${
                  !canPreviousPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiChevronLeft size={20} />
              </button>

              {(() => {
                const totalPages = pageOptions.length;
                let startPage = Math.max(
                  0,
                  Math.min(pageIndex - 2, totalPages - 5)
                );
                let endPage = Math.min(totalPages, startPage + 5);

                return Array.from(
                  { length: endPage - startPage },
                  (_, i) => startPage + i
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      gotoPage(pageNum);
                    }}
                    className={`px-3 py-1 rounded ${
                      pageNum === pageIndex
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                ));
              })()}

              <button
                onClick={() => {
                  nextPage();
                }}
                disabled={!canNextPage}
                className={`p-1 rounded ${
                  !canNextPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiChevronRight size={20} />
              </button>

              <button
                onClick={() => {
                  gotoPage(pageCount - 1);
                }}
                disabled={!canNextPage}
                className={`p-1 rounded ${
                  !canNextPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Go to last page"
              >
                <FiChevronsRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Uploading Files
            </h3>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(uploadProgress)}% completed (
              {Math.min(
                Math.floor((uploadProgress / 100) * selectedFiles.length),
                selectedFiles.length
              )}{" "}
              of {selectedFiles.length} files)
            </p>
            <div className="flex justify-center mt-4">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilesManager;
