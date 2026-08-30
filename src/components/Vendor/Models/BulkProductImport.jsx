import React, { useState } from "react";
import { FiUpload, FiDownload, FiFile, FiAlertCircle } from "react-icons/fi";
import {
  importTemplate,
  bulkProductUpload,
  stockPriceUpdateTemplate,
  bulkStockPriceUpdate,
} from "../../../services/api.product";
import {
  notifyOnFail,
  notifyOnSuccess,
} from "../../../utils/notification/toast";

const BulkProductImport = ({ vendorId, user, compact = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [stockUpdateResults, setStockUpdateResults] = useState(null);
  const [errors, setErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [operationType, setOperationType] = useState("productImport");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setErrors([]);
    setDuplicates([]);
    setImportResults(null);
    setStockUpdateResults(null);
  };

  const downloadTemplate = async (type) => {
    try {
      setIsDownloading(true);
      let response;
      if (type === "productImport") {
        response = await importTemplate(vendorId);
      } else {
        response = await stockPriceUpdateTemplate();
      }
      if (response.status === 1) {
        notifyOnSuccess(`Template downloaded successfully`);
      }
    } catch (error) {
      console.error("Download error:", error);
      notifyOnFail("Failed to download template. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      notifyOnFail("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setDuplicates([]);
    setImportResults(null);
    setStockUpdateResults(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      let response;
      if (operationType === "productImport") {
        response = await bulkProductUpload(formData, vendorId);
      } else {
        response = await bulkStockPriceUpdate(formData);
      }

      if (response.status === 1) {
        if (operationType === "productImport") {
          setImportResults(response.products);
          notifyOnSuccess(
            `Successfully imported ${response.products?.length} products`
          );
        } else {
          setStockUpdateResults({
            products: response.updatedProducts,
            variations: response.updatedVariations,
          });
          notifyOnSuccess(
            `Successfully updated ${response.updatedProducts?.length} products and ${response.updatedVariations?.length} variations`
          );
        }
      } else {
        if (response.errors && response.errors.length > 0) {
          setErrors(response.errors);
          notifyOnFail(
            response.errors[0]?.error ||
              "Check the file properly and try again."
          );
        }
        if (response.duplicates && response.duplicates.length > 0) {
          setDuplicates(response.duplicates);
          notifyOnFail("Duplicate products or variations found");
        }
      }
    } catch (error) {
      console.error("Error during upload:", error);
      notifyOnFail("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={compact ? "space-y-5" : "p-6 rounded-lg"}>
      {compact ? null : (
        <h2 className="text-2xl font-bold mb-6">Bulk Product Management</h2>
      )}

      <div className={compact ? "mb-4 max-w-md" : "mb-6"}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operation
        </label>
        <select
          value={operationType}
          onChange={(e) => setOperationType(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="productImport">Create new listings (full Excel)</option>
          <option value="stockPriceUpdate">
            Update existing listings (name, HSN, GST, price, stock, specs, variations)
          </option>
        </select>
      </div>

      <div className="mb-8">
        <button
          onClick={() => downloadTemplate(operationType)}
          disabled={isDownloading}
          className={`flex items-center px-4 py-2 ${
            isDownloading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white rounded-md transition-colors`}
        >
          {isDownloading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Downloading...
            </>
          ) : (
            <>
              <FiDownload className="mr-2" />
              Download {operationType === "productImport"
                ? "Import"
                : "Update"}{" "}
              Template
            </>
          )}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Download the template, fill it with your{" "}
          {operationType === "productImport"
            ? "product data"
            : "stock and price updates"}
          , and upload it below.
        </p>
      </div>

      <div
        className={`border-2 border-dashed border-gray-300 rounded-xl text-center mb-6 ${
          compact ? "p-6" : "p-8"
        }`}
      >
        <input
          type="file"
          id="product-file-upload"
          accept=".xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="product-file-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          {selectedFile ? (
            <>
              <FiFile className="text-4xl text-blue-500 mb-3" />
              <span className="font-medium">{selectedFile.name}</span>
              <span className="text-sm text-gray-500">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </>
          ) : (
            <>
              <FiUpload className="text-4xl text-gray-400 mb-3" />
              <span className="font-medium">
                Drop your file here or click to browse
              </span>
              <span className="text-sm text-gray-500">
                Supports XLSX files (max 5MB)
              </span>
            </>
          )}
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isUploading}
        className={`w-full py-3 rounded-md font-medium ${
          !selectedFile || isUploading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        } transition-colors`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading...
          </span>
        ) : operationType === "productImport" ? (
          "Upload Products"
        ) : (
          "Update Stock & Prices"
        )}
      </button>

      {errors.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-bold text-red-700 mb-2">Validation Errors:</h3>
          <ul className="text-sm text-red-600 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>
                {error.error} (Row {error.row})
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-bold text-yellow-700 mb-2 flex items-center">
            <FiAlertCircle className="mr-2" />
            Duplicate Products Found:
          </h3>
          <p className="text-sm text-yellow-600 mb-3">
            The following products or variations were not imported because they
            already exist in the system.
          </p>
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-yellow-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                    Parent SKU
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                    Row
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-yellow-200">
                {duplicates.map((duplicate, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-800 capitalize">
                      {duplicate.type}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-800">
                      {duplicate.sku}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-800">
                      {duplicate.parent_sku || "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-800">
                      {duplicate.row}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResults && operationType === "productImport" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-bold text-green-700 mb-2">Import Successful!</h3>
          <p className="text-green-600">
            Successfully imported {importResults.length} products.
          </p>
          <div className="mt-3">
            <p className="font-medium">Imported Products:</p>
            <div className="max-h-40 overflow-y-auto mt-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importResults?.map((product) => (
                    <tr key={product.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {stockUpdateResults && operationType === "stockPriceUpdate" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-bold text-green-700 mb-2">Update Successful!</h3>
          <p className="text-green-600">
            Successfully updated {stockUpdateResults.products.length} products
            and {stockUpdateResults.variations.length} variations.
          </p>
          <div className="mt-3">
            <p className="font-medium">Updated Products:</p>
            <div className="max-h-40 overflow-y-auto mt-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockUpdateResults.products?.map((product) => (
                    <tr key={product.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-medium mt-4">Updated Variations:</p>
            <div className="max-h-40 overflow-y-auto mt-2">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product SKU
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variation SKU
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockUpdateResults.variations?.map((variation) => (
                    <tr key={variation.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {variation.id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {variation.product_sku}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {variation.sku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductImport;
