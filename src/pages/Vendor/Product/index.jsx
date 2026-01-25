import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductModal from "../../../components/Vendor/Models/ProductModal";
import DeleteConfirmationModal from "../../../components/Vendor/Models/DeleteConfirmationModal";
import {
  deleteProduct,
  getProductsByVendorId,
  patchProduct,
} from "../../../services/api.product";
import { useAppContext } from "../../../context/AppContext";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";
import config from "../../../config/config";
import { motion } from "framer-motion";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className="h-32 bg-gray-200 rounded-lg" />
      ))}
    </div>
    <div className="h-12 bg-gray-200 rounded-lg" />
    {[...Array(5)].map((_, idx) => (
      <div key={idx} className="h-20 bg-gray-100 rounded-lg" />
    ))}
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16 bg-white rounded-lg"
  >
    <Package className="w-20 h-20 mx-auto text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      No Products Found
    </h3>
    <p className="text-gray-500">
      Start by adding your first product to the store.
    </p>
  </motion.div>
);

const StatCard = ({ title, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden"
  >
    <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

const ConfirmUpdateModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isUpdating,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isUpdating}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {isUpdating ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Product = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
  });
  const [total, setTotal] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null); // { productId, field, value }
  const [isUpdating, setIsUpdating] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const itemsPerPage = 10;
  const editRef = useRef(null); // For focusing the input
  const editingCellRef = useRef(null);
  const editValueRef = useRef("");
  const errorRef = useRef(null);
  const forceRender = useCallback(() => setForceUpdate((prev) => prev + 1), []);
  const fetchProducts = async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await getProductsByVendorId(user.id, params);
      if (response.status === 1) {
        setProducts(response.data.products);
        setStats(response.data.stats);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      notifyOnFail("Unable to fetch products");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      ...(searchQuery && { search: searchQuery }),
      ...(sortConfig.key && {
        sortBy:
          sortConfig.key === "Category.title" ? "category" : sortConfig.key,
      }),
      ...(sortConfig.key && { sortDir: sortConfig.direction }),
    };
    if (visibilityFilter !== "all") {
      params.visibility =
        visibilityFilter.charAt(0).toUpperCase() + visibilityFilter.slice(1);
    }
    fetchProducts(params);
  }, [currentPage, visibilityFilter, searchQuery, sortConfig, user.id]);
  const getTotalStock = (product) => {
    return product.is_variation
      ? product.variations?.variation_combinations?.reduce(
          (total, variation) => total + variation.stock,
          0,
        ) || 0
      : product.stock || 0;
  };
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };
  const getMainImage = (media) => {
    return (
      media?.find((m) => m.type === "image")?.url || "/placeholder-image.jpg"
    );
  };
  const startEditing = useCallback(
    (rowId, column, initialValue) => {
      editingCellRef.current = { rowId, column };
      editValueRef.current = initialValue?.toString() || "";
      errorRef.current = null;
      forceRender();
    },
    [forceRender],
  );
  const cancelEditing = useCallback(() => {
    editingCellRef.current = null;
    editValueRef.current = "";
    errorRef.current = null;
    forceRender();
  }, [forceRender]);
  const validateEdit = (column, currentProduct) => {
    let value;
    if (column === "stock") {
      value = parseInt(editValueRef.current);
    } else if (column === "visibility") {
      value = editValueRef.current;
    } else {
      value = parseFloat(editValueRef.current);
    }
    if (column === "original_price" || column === "discounted_price") {
      if (isNaN(value) || value <= 0) {
        errorRef.current = "Must be a positive number";
        forceRender();
        return false;
      }
      if (
        column === "discounted_price" &&
        value > (currentProduct.original_price || 0)
      ) {
        errorRef.current = "Discounted price cannot exceed original price";
        forceRender();
        return false;
      }
    } else if (column === "stock") {
      if (isNaN(value) || value < 0) {
        errorRef.current = "Must be a non-negative integer";
        forceRender();
        return false;
      }
    } else if (column === "visibility") {
      if (!["Hidden", "Published"].includes(value)) {
        errorRef.current = "Visibility must be 'Hidden' or 'Published'";
        forceRender();
        return false;
      }
    }
    errorRef.current = null;
    forceRender();
    return true;
  };
  const saveEdit = (productId, column, currentProduct) => {
    if (!validateEdit(column, currentProduct)) return;
    setPendingUpdate({ productId, field: column, value: editValueRef.current });
    setIsUpdateModalOpen(true);
  };
  const confirmUpdate = async () => {
    setIsUpdating(true);
    try {
      const { productId, field, value } = pendingUpdate;
      const updates = { [field]: value };
      const response = await patchProduct(productId, updates);
      if (response.status === 1) {
        notifyOnSuccess("Product updated successfully");
        await fetchProducts(); // Refresh list
      } else {
        notifyOnFail(response.message || "Update failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      notifyOnFail("Unable to update product");
    } finally {
      setIsUpdating(false);
      setIsUpdateModalOpen(false);
      setPendingUpdate(null);
      cancelEditing();
    }
  };
  // Focus the input when editing starts
  useEffect(() => {
    if (editingCellRef.current && editRef.current) {
      editRef.current.focus();
    }
  }, [forceUpdate]);
  const columnVisibility = {
    index: "hidden sm:table-cell",
    name: "",
    "Category.title": "hidden lg:table-cell",
    original_price: "hidden md:table-cell",
    discounted_price: "hidden md:table-cell",
    stock: "hidden md:table-cell",
    visibility: "",
    bank_settlement_amount: "hidden lg:table-cell",
    actions: "",
  };
  const getColumnClass = (columnId) => columnVisibility[columnId] || "";
  const columns = useMemo(
    () => [
      {
        accessorKey: "index",
        header: "No.",
        cell: ({ row }) => (currentPage - 1) * itemsPerPage + row.index + 1,
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: () => <div className="flex items-center gap-2">Product</div>,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              src={getMainImage(row.original.media)}
              alt={row.original.name}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            />
            <span className="font-medium text-gray-900 truncate">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "Category.title",
        header: "Categories",
        cell: ({ row }) => row.original.Category?.title || "N/A",
      },
      {
        accessorKey: "original_price",
        header: "MRP",
        cell: ({ row }) => {
          const product = row.original;
          const isEditing =
            editingCellRef.current?.rowId === product.id &&
            editingCellRef.current?.column === "original_price";
          const displayValue = formatPrice(product.original_price);
          if (isEditing) {
            return (
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded">
                <input
                  ref={editRef}
                  type="number"
                  step="0.01"
                  value={editValueRef.current}
                  onChange={(e) => {
                    editValueRef.current = e.target.value;
                    forceRender();
                  }}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit(product.id, "original_price", product);
                  }}
                  className="p-1 text-green-500 hover:bg-green-100 rounded"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
                {errorRef.current && (
                  <span className="text-red-500 text-xs ml-1">
                    {errorRef.current}
                  </span>
                )}
              </div>
            );
          }
          return (
            <div
              className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(
                  product.id,
                  "original_price",
                  product.original_price,
                );
              }}
              title="Click to edit MRP"
            >
              <span className="text-sm font-medium text-gray-900">
                {displayValue}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "discounted_price",
        header: "Discounted Price",
        cell: ({ row }) => {
          const product = row.original;
          const isEditing =
            editingCellRef.current?.rowId === product.id &&
            editingCellRef.current?.column === "discounted_price";
          const displayValue = formatPrice(product.discounted_price);
          if (isEditing) {
            return (
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded">
                <input
                  ref={editRef}
                  type="number"
                  step="0.01"
                  value={editValueRef.current}
                  onChange={(e) => {
                    editValueRef.current = e.target.value;
                    forceRender();
                  }}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit(product.id, "discounted_price", product);
                  }}
                  className="p-1 text-green-500 hover:bg-green-100 rounded"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
                {errorRef.current && (
                  <span className="text-red-500 text-xs ml-1">
                    {errorRef.current}
                  </span>
                )}
              </div>
            );
          }
          return (
            <div
              className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(
                  product.id,
                  "discounted_price",
                  product.discounted_price,
                );
              }}
              title="Click to edit Discounted Price"
            >
              <span className="text-sm font-medium text-gray-900">
                {displayValue}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const product = row.original;
          const value = getTotalStock(product);
          const isVariation = product.is_variation;
          const isEditing =
            editingCellRef.current?.rowId === product.id &&
            editingCellRef.current?.column === "stock";
          if (isVariation) {
            return (
              <span
                className="text-sm text-gray-500"
                title="Update stock via variations"
              >
                {value} <span className="text-xs">(Variations)</span>
              </span>
            );
          }
          if (isEditing) {
            return (
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded">
                <input
                  ref={editRef}
                  type="number"
                  value={editValueRef.current}
                  onChange={(e) => {
                    editValueRef.current = e.target.value;
                    forceRender();
                  }}
                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit(product.id, "stock", product);
                  }}
                  className="p-1 text-green-500 hover:bg-green-100 rounded"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
                {errorRef.current && (
                  <span className="text-red-500 text-xs ml-1">
                    {errorRef.current}
                  </span>
                )}
              </div>
            );
          }
          return (
            <div
              className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                startEditing(product.id, "stock", value);
              }}
              title="Click to edit Stock"
            >
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "visibility",
        header: "Visibility",
        cell: ({ row }) => {
          const product = row.original;
          const isEditing =
            editingCellRef.current?.rowId === product.id &&
            editingCellRef.current?.column === "visibility";
          if (isEditing) {
            return (
              <div className="flex items-center gap-2 p-1 bg-gray-50 rounded">
                <select
                  ref={editRef}
                  value={editValueRef.current}
                  onChange={(e) => {
                    editValueRef.current = e.target.value;
                    forceRender();
                  }}
                  className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Hidden">Hidden</option>
                  <option value="Published">Published</option>
                </select>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEdit(product.id, "visibility", product);
                  }}
                  className="p-1 text-green-500 hover:bg-green-100 rounded"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
                {errorRef.current && (
                  <span className="text-red-500 text-xs ml-1">
                    {errorRef.current}
                  </span>
                )}
              </div>
            );
          }
          const badgeClass =
            product.visibility === "Published"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700";
          return (
            <div
              className={`cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors ${badgeClass}`}
              onClick={(e) => {
                e.stopPropagation();
                startEditing(product.id, "visibility", product.visibility);
              }}
              title="Click to toggle Visibility"
            >
              <span className="px-2 py-1 rounded-full text-sm font-medium">
                {product.visibility}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "bank_settlement_amount",
        header: "Settlement",
        cell: ({ row }) => formatPrice(row.original.bank_settlement_amount),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal(row.original);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="View"
            >
              <MessageSquare className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  `${config.VITE_BASE_VENDOR_URL}/product/edit/${row.original.id}`,
                );
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(row.original);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [currentPage, itemsPerPage], // Stable dependencies only
  );
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sortConfig.key
        ? [{ id: sortConfig.key, desc: sortConfig.direction === "desc" }]
        : [],
      pagination: { pageIndex: currentPage - 1, pageSize: itemsPerPage },
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / itemsPerPage),
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater(table.getState().pagination)
          : updater;
      setCurrentPage(newState.pageIndex + 1);
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function"
          ? updater(table.getState().sorting)
          : updater;
      if (newSorting.length > 0) {
        const { id: key, desc } = newSorting[0];
        setSortConfig({
          key: key === "Category.title" ? "Category.title" : key,
          direction: desc ? "desc" : "asc",
        });
        setCurrentPage(1);
      } else {
        setSortConfig({ key: null, direction: "asc" });
      }
    },
  });
  const openModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };
  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };
  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsDeletingProduct(true);
    try {
      const response = await deleteProduct(selectedProduct.id);
      if (response.status === 1) {
        setIsDeleteModalOpen(false);
        await fetchProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      notifyOnFail("Unable to delete the product");
    } finally {
      setIsDeletingProduct(false);
    }
  };
  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
          {/* Stats Cards - Responsive grid */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            <StatCard title="Total Products" value={stats.totalProducts} />
            <StatCard
              title="Published Products"
              value={stats.publishedProducts}
            />
            <StatCard title="Total Stock" value={stats.totalStock} />
            <StatCard title="Low Stock Items" value={stats.lowStockProducts} />
          </div>
          {/* Promotional Banner - Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:w-1/2 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 sm:p-8 mb-6 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
                Increase your sales
              </h2>
              <p className="text-white/90 mb-4 max-w-2xl text-sm sm:text-base">
                Discover the Proven Methods to Skyrocket Your Sales! Unleash the
                Potential of Your Business and Achieve Remarkable Growth.
                Whether you're a seasoned entrepreneur or just starting out
              </p>
              <button className="bg-white text-orange-500 px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm sm:text-base">
                Learn More
              </button>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <path
                  d="M 0 100 Q 50 50 100 100 T 200 100 L 200 200 L 0 200 Z"
                  fill="white"
                />
              </svg>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6"
        >
          {/* Tabs - Stack on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-1 border-b border-gray-100">
            <button
              onClick={() => {
                setVisibilityFilter("all");
                setCurrentPage(1);
              }}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                visibilityFilter === "all"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Products ({stats.totalProducts})
            </button>
            <button
              onClick={() => {
                setVisibilityFilter("published");
                setCurrentPage(1);
              }}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                visibilityFilter === "published"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Published ({stats.publishedProducts})
            </button>
            <button
              onClick={() => {
                setVisibilityFilter("draft");
                setCurrentPage(1);
              }}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                visibilityFilter === "draft"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Draft ({stats.draftProducts})
            </button>
          </div>
          {/* Search and Actions - Responsive flex */}
          <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search product report"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 self-start sm:self-center">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() =>
                navigate(`${config.VITE_BASE_VENDOR_URL}/product/add`)
              }
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors w-full sm:w-auto self-start sm:self-center"
            >
              Add Product
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-gray-100"
                    >
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-2 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 ${getColumnClass(
                            header.id,
                          )}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <span className="text-gray-400">
                              {header.column.getIsSorted() === "asc"
                                ? "↑"
                                : header.column.getIsSorted() === "desc"
                                ? "↓"
                                : ""}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-2 sm:px-6 py-4 text-xs sm:text-sm text-gray-700 relative ${getColumnClass(
                            cell.column.id,
                          )}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination - Responsive */}
            <div className="px-2 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4 sm:gap-0">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page</span>
                <span className="font-medium">
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
              </div>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <ProductModal
        isOpen={showModal}
        onClose={closeModal}
        product={selectedProduct}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        isDeleting={isDeletingProduct}
      />

      <ConfirmUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onConfirm={confirmUpdate}
        title="Confirm Update"
        message="Are you sure you want to update this field? This action will save the changes."
        isUpdating={isUpdating}
      />
    </div>
  );
};
export default Product;
