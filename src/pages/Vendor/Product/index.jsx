import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductModal from "../../../components/Vendor/Models/ProductModal";
import DeleteConfirmationModal from "../../../components/Vendor/Models/DeleteConfirmationModal";
import {
  deleteProduct,
  getProductsByVendorId,
} from "../../../services/api.product";
import { useAppContext } from "../../../context/AppContext";
import { notifyOnFail } from "../../../utils/notification/toast";
import config from "../../../config/config";
import { motion } from "framer-motion";

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
  const itemsPerPage = 10;

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

  const getTotalStock = (variations) => {
    return variations?.variation_combinations?.reduce((total, variation) => {
      return total + variation.stock;
    }, 0);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Stats Cards */}
          <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <StatCard title="Total Products" value={stats.totalProducts} />
            <StatCard
              title="Published Products"
              value={stats.publishedProducts}
            />
            <StatCard title="Total Stock" value={stats.totalStock} />
            <StatCard title="Low Stock Items" value={stats.lowStockProducts} />
          </div>

          {/* Promotional Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:w-1/2 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-6 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                Increase your sales
              </h2>
              <p className="text-white/90 mb-4 max-w-2xl">
                Discover the Proven Methods to Skyrocket Your Sales! Unleash the
                Potential of Your Business and Achieve Remarkable Growth.
                Whether you're a seasoned entrepreneur or just starting out
              </p>
              <button className="bg-white text-orange-500 px-6 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
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

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6"
        >
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 border-b border-gray-100">
            <button
              onClick={() => {
                setVisibilityFilter("all");
                setCurrentPage(1);
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
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
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                visibilityFilter === "draft"
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Draft ({stats.draftProducts})
            </button>
          </div>

          {/* Search and Actions */}
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1 relative">
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
            <button className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() =>
                navigate(`${config.VITE_BASE_VENDOR_URL}/product/add`)
              }
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Add Product
            </button>
          </div>
        </motion.div>

        {/* Table */}
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
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-16">
                      No.
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Product
                        <span className="text-gray-400">
                          {sortConfig.key === "name" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("Category.title")}
                    >
                      <div className="flex items-center gap-2">
                        Categories
                        <span className="text-gray-400">
                          {sortConfig.key === "Category.title" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("stock")}
                    >
                      <div className="flex items-center gap-2">
                        Stock
                        <span className="text-gray-400">
                          {sortConfig.key === "stock" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("discounted_price")}
                    >
                      <div className="flex items-center gap-2">
                        Price
                        <span className="text-gray-400">
                          {sortConfig.key === "discounted_price" &&
                            (sortConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getMainImage(product.media)}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <span className="font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {product.Category?.title || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {product.is_variation
                          ? getTotalStock(product.variations)
                          : product.stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {formatPrice(product.discounted_price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(product)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `${config.VITE_BASE_VENDOR_URL}/product/edit/${product.id}`
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Page</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[...Array(totalPages)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">of {totalPages}</span>
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
};

export default Product;
