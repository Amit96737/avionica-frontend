import { useEffect, useState } from "react";

import {
  Eye,
  Pencil,
  Trash2,
  Upload,
  RefreshCw,
  X,
  Building2,
  MapPin,
  CalendarDays,
  User,
  FileText,
  CheckCircle2,
  Search,
  ExternalLink,
  Plus,
} from "lucide-react";

import "../../src/App.css";

import { API_BASE_URL } from "../../src/constants";

const ManufacturerManagement = () => {
  const [file, setFile] = useState(null);
  const [manufacturers, setManufacturers] = useState([]);
  const [allManufacturers, setAllManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showAllManufacturers, setShowAllManufacturers] = useState(false);
  const [totalManufacturers, setTotalManufacturers] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [showAllManufacturerModal, setShowAllManufacturerModal] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const recordsPerPage = 15;

  const selectedManufacturers = manufacturers.filter((manufacturer) =>
    selectedIds.includes(manufacturer.id)
  );

  const allSelectedInactive =
    selectedManufacturers.length > 0 &&
    selectedManufacturers.every(
      (manufacturer) => !manufacturer.is_approved
    );

  const allSelectedApproved =
    selectedManufacturers.length > 0 &&
    selectedManufacturers.every(
      (manufacturer) => manufacturer.is_approved
    );

  const handleSelectManufacturer = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const fetchManufacturers = async () => {
    try {
      setListLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/manufacturer-details/`
      );

      const data = await response.json();

      const manufacturersData = Array.isArray(data)
        ? data
        : data?.data || [];

      setManufacturers(manufacturersData);

      setTotalManufacturers(manufacturersData.length);

      setSelectedIds([]);
    } catch (error) {
      // console.error("Error fetching manufacturers:", error);
      // setError("Failed to fetch manufacturers.");
    } finally {
      setListLoading(false);
    }
  };

  const fetchAllManufacturers = async () => {
    try {
      setListLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/manufacturer/`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch manufacturers."
        );
      }

      const manufacturersData = Array.isArray(data)
        ? data
        : data?.data || [];

      setAllManufacturers(manufacturersData);
      setShowAllManufacturerModal(true);
    } catch (error) {
      console.error("Error fetching all manufacturers:", error);
      setError("Failed to fetch all manufacturers.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setFile(selectedFile || null);
    setMessage("");
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/upload-manufacturer-file/`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage =
          "Failed to upload manufacturer file.";

        if (typeof data?.detail === "string") {
          errorMessage = data.detail;
        } else if (typeof data?.detail === "object") {
          errorMessage =
            data.detail?.message ||
            "CSV contains validation errors.";

          if (Array.isArray(data.detail?.errors)) {
            errorMessage +=
              " " + data.detail.errors.join(" ");
          }
        }

        throw new Error(errorMessage);
      }

      const taskId = data?.task_id;

      if (!taskId) {
        throw new Error(
          "Import task ID was not received."
        );
      }

      setMessage(
        "Manufacturer import started. Please wait..."
      );

      const checkImportStatus = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `${API_BASE_URL}/manufacturer/upload-manufacturer-status/${taskId}`,
            {
              credentials: "include",
            }
          );

          const statusData = await statusResponse.json();

          if (!statusResponse.ok) {
            clearInterval(checkImportStatus);

            throw new Error(
              statusData?.detail ||
                "Failed to check import status."
            );
          }

          if (statusData.status === "completed") {
            clearInterval(checkImportStatus);

            setUploadedCount(
              statusData.inserted_records || 0
            );

            setUpdatedCount(
              statusData.updated_records || 0
            );

            const manufacturerIds =
              statusData?.manufacturer_ids || [];

            if (manufacturerIds.length > 0) {
              const allResponse = await fetch(
                `${API_BASE_URL}/manufacturer/manufacturer/`
              );

              const allData = await allResponse.json();

              if (!allResponse.ok) {
                throw new Error(
                  allData?.detail ||
                    "Failed to fetch manufacturers."
                );
              }

              const allManufacturersData =
                Array.isArray(allData)
                  ? allData
                  : allData?.data || [];

              const uploadedManufacturers =
                allManufacturersData.filter(
                  (manufacturer) =>
                    manufacturerIds.includes(
                      manufacturer.id
                    )
                );

              setManufacturers(
                uploadedManufacturers
              );

              setTotalManufacturers(
                uploadedManufacturers.length
              );

              setCurrentPage(1);
            }

            setShowAllManufacturers(false);
            setSelectedIds([]);

            setMessage(
              "Manufacturers update successfully."
            );

            const fileInput =
              document.getElementById(
                "manufacturerFile"
              );

            if (fileInput) {
              fileInput.value = "";
            }

            setFile(null);
            setLoading(false);
          }

          if (statusData.status === "failed") {
            clearInterval(checkImportStatus);

            setLoading(false);

            setError(
              statusData?.message ||
                "Failed to import manufacturer data."
            );
          }
        } catch (error) {
          clearInterval(checkImportStatus);

          console.error(
            "Import Status Error:",
            error
          );

          setLoading(false);

          setError(
            error.message ||
              "Failed to check import status."
          );
        }
      }, 1500);

    } catch (err) {
      console.error("Upload Error:", err);

      setError(
        err.message ||
          "Failed to upload manufacturer file."
      );

      setLoading(false);
    }
  };

  const [bulkApproveLoading, setBulkApproveLoading] =
    useState(false);

  const [bulkDisapproveLoading, setBulkDisapproveLoading] =
    useState(false);

  // SINGLE MANUFACTURER APPROVE / UNAPPROVE
  const handleApprovalToggle = async (manufacturer) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/manufacturer/update-manufacturer/?manufacturer_id=${manufacturer.id}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to update manufacturer status."
        );
      }

      setManufacturers((prev) =>
        prev.map((item) =>
          item.id === manufacturer.id
            ? {
                ...item,
                is_approved: data.is_approved,
              }
            : item
        )
      );

      setMessage(
        data.is_approved
          ? "Manufacturer approved successfully."
          : "Manufacturer approval removed successfully."
      );
    } catch (err) {
      console.error("Status Update Error:", err);

      setError(
        err.message ||
          "Failed to update manufacturer status."
      );
    }
  };

  const handleView = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setShowViewModal(true);
  };

  // const handleEdit = (manufacturer) => {
  //   setEditData({ ...manufacturer });
  //   setShowEditModal(true);
  // };

  // const handleEditChange = (e) => {
  //   const { name, value } = e.target;
  //   setEditData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  // BULK APPROVE
  const idsToApprove = [...selectedIds];

  const handleBulkApprove = async () => {

  if (selectedIds.length === 0) return;

  const idsToApprove = [...selectedIds];

  try {

    setBulkApproveLoading(true);

    setMessage("");

    setError("");

    const response = await fetch(
      `${API_BASE_URL}/manufacturer/bulk-approve-manufacturer/`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          manufacturer_ids: idsToApprove,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data?.detail ||
          "Failed to approve manufacturers."
      );

    }

    // UI immediately Active

    setManufacturers((prev) =>
      prev.map((manufacturer) =>
        idsToApprove.includes(manufacturer.id)
          ? {
              ...manufacturer,
              is_approved: true,
            }
          : manufacturer
      )
    );

    // Selection clear

    setSelectedIds([]);

    setMessage(
      data?.message ||
        `${idsToApprove.length} manufacturer(s) approved successfully.`
    );

    setBulkApproveLoading(false);

  } catch (err) {

    console.error(
      "Bulk Approve Error:",
      err
    );

    setError(
      err.message ||
        "Failed to approve manufacturers."
    );

    setBulkApproveLoading(false);
  }
};

  const handleBulkDisApprove = async () => {

  if (selectedIds.length === 0) return;

  try {

    const response = await fetch(
      `${API_BASE_URL}/manufacturer/bulk-disapprove-manufacturer/`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          manufacturer_ids: selectedIds,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          "Failed to disapprove manufacturers."
      );
    }

    setManufacturers((prev) =>
      prev.map((manufacturer) =>
        selectedIds.includes(manufacturer.id)
          ? {
              ...manufacturer,
              is_approved: false,
            }
          : manufacturer
      )
    );

    // setMessage(
    //   `${selectedIds.length} manufacturer(s) approved successfully.`
    // );

    setSelectedIds([]);

  } catch (err) {

    console.error("Bulk Approve Error:", err);

    setError(
      err.message ||
        "Failed to disapprove manufacturers."
    );
  }
};

  // BULK DELETE
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkDeleteLoading(true);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/bulk-delete-manufacturer/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            manufacturer_ids: selectedIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete manufacturers."
        );
      }

      setShowBulkDeleteModal(false);

      setMessage(
        data?.message ||
          "Manufacturers deleted successfully."
      );

      setSelectedIds([]);

      await fetchManufacturers();

    } catch (err) {
      console.error("Bulk Delete Error:", err);

      setError(
        err.message ||
          "Failed to delete manufacturers."
      );
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editData?.id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/manufacturer/${editData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: editData.company_name,
            headquarter: editData.headquarter,
            founding_date: editData.founding_date,
            company_description:
              editData.company_description,
            company_history:
              editData.company_history,
            licence_type: editData.licence_type,
            author_name: editData.author_name,
            wiki_link: editData.wiki_link,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to update manufacturer."
        );
      }

      setShowEditModal(false);
      setEditData(null);

      setMessage("Manufacturer updated successfully.");

      await fetchManufacturers();
    } catch (err) {
      console.error("Update Error:", err);

      setError(
        err.message ||
          "Failed to update manufacturer."
      );
    }
  };

  const handleDeleteClick = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setShowDeleteModal(true);
  };

  // SINGLE MANUFACTURER DELETE
  const handleDelete = async () => {
    if (!selectedManufacturer?.id) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/delete-manufacturer/?manufacturer_id=${selectedManufacturer.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to delete manufacturer."
        );
      }

      setShowDeleteModal(false);
      setSelectedManufacturer(null);

      setMessage("Manufacturer deleted successfully.");

      await fetchManufacturers();
    } catch (err) {
      console.error("Delete Error:", err);

      setError(
        err.message ||
          "Failed to delete manufacturer."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredManufacturers = manufacturers.filter(
    (manufacturer) => {
      const searchText = search.toLowerCase();

      return (
        manufacturer.company_name
          ?.toLowerCase()
          .includes(searchText) ||
        manufacturer.headquarter
          ?.toLowerCase()
          .includes(searchText) ||
        manufacturer.licence_type
          ?.toLowerCase()
          .includes(searchText) ||
        manufacturer.author_name
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  const totalPages = Math.ceil(
    filteredManufacturers.length / recordsPerPage
  );

  const startIndex =
    (currentPage - 1) * recordsPerPage;

  const paginatedManufacturers =
    filteredManufacturers.slice(
      startIndex,
      startIndex + recordsPerPage
    );

  return (
    <div className="manufacturer-page">

      {/* HEADER BANNER */}
      <div className="manufacturer-header-banner">
        <h1>Manufacturer Management</h1>

      </div>

      {/* MESSAGES */}
      {message && (
        <div className="success-message">
          <CheckCircle2 size={18} />

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <X size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* UPLOAD CARD */}
      <div className="upload-card">
        <div className="upload-area">

          <div className="file-input-wrapper">

            <input
              id="manufacturerFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />

            <label
              htmlFor="manufacturerFile"
              className="file-custom-label"
            >
              <Upload size={16} />

              <span>
                {file
                  ? file.name
                  : "Choose CSV file"}
              </span>
            </label>

          </div>

          <button
            type="button"
            className="upload-button"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? (
              <span className="upload-spinner"></span>
            ) : (
              <>
                <Upload size={16} />
                Upload Manufacturer
              </>
            )}
          </button>

        </div>
      </div>

      {/* LIST CARD */}
      <div className="manufacturer-list">

        <div className="list-header">

          <h2>Manufacturers Listing</h2>

          <div className="manufacturer-counts">

            <div className="count-item">
              <span>Total</span>
              <strong>{totalManufacturers}</strong>
            </div>

            <div className="count-item">
              <span>Created</span>
              <strong>{uploadedCount}</strong>
            </div>

            <div className="count-item">
              <span>Updated</span>
              <strong>{updatedCount}</strong>
            </div>

          </div>
        </div>

        {/* BULK ACTIONS */}
        <div className="bulk-actions">

          <button
            type="button"
            className="bulk-approve-button"
            disabled={
              selectedIds.length === 0 ||
              allSelectedInactive
            }
            onClick={handleBulkDisApprove}
          >
            <CheckCircle2 size={16} />
            Disapprove
          </button>

          <button
            type="button"
            className="bulk-approve-button"
            disabled={
              selectedIds.length === 0 ||
              allSelectedApproved ||
              bulkApproveLoading ||
              bulkDisapproveLoading ||
              bulkDeleteLoading
            }
            onClick={handleBulkApprove}
          >
            {bulkApproveLoading ? (
              <>
                <RefreshCw
                  size={16}
                  className="loading-icon"
                />
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Approve
              </>
            )}
          </button>

          <button
            type="button"
            className="bulk-delete-button"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDeleteClick}
          >
            <Trash2 size={16} />
            Delete Selected
          </button>

        </div>

        {listLoading ? (
          <div className="empty-state">

            <RefreshCw
              size={30}
              className="loading-icon"
            />

            <p>Loading manufacturers...</p>

          </div>
        ) : filteredManufacturers.length === 0 ? (
          <div className="empty-state">

            <Building2 size={35} />

            <h3>No manufacturers found</h3>

          </div>
        ) : (
          <div className="table-container">

            <table className="manufacturer-table">

              <thead>

                <tr>

                  {/* SELECT ALL */}
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        filteredManufacturers.length > 0 &&
                        filteredManufacturers.every(
                          (manufacturer) =>
                            selectedIds.includes(
                              manufacturer.id
                            )
                        )
                      }
                      onChange={(e) => {

                        if (e.target.checked) {

                          setSelectedIds(
                            filteredManufacturers.map(
                              (manufacturer) =>
                                manufacturer.id
                            )
                          );

                        } else {

                          setSelectedIds([]);

                        }

                      }}
                    />
                  </th>

                  <th>S.No.</th>

                  <th>Manufacturer Name</th>

                  <th>Logo</th>

                  <th>Status</th>

                  <th className="action-header">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginatedManufacturers.map(
                  (manufacturer, index) => (

                    <tr
                      key={
                        manufacturer.id || index
                      }
                    >

                      {/* ROW SELECT */}
                      <td>

                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            manufacturer.id
                          )}
                          onChange={() =>
                            handleSelectManufacturer(
                              manufacturer.id
                            )
                          }
                        />

                      </td>

                      {/* S.NO */}
                      <td className="serial-number">
                        {startIndex + index + 1}
                      </td>

                      {/* NAME */}
                      <td>

                        <strong className="company-name-text">
                          {manufacturer.company_name ||
                            "-"}
                        </strong>

                      </td>

                      {/* LOGO */}
                      <td>

                        <div className="logo-wrapper">

                          {manufacturer.logo ? (

                            <img
                              src={manufacturer.logo}
                              alt={
                                manufacturer.company_name ||
                                "Manufacturer Logo"
                              }
                              className="manufacturer-logo"
                            />

                          ) : (

                            <Building2
                              size={20}
                              color="#94a3b8"
                            />

                          )}

                        </div>

                      </td>

                      {/* STATUS */}
                      <td>

                        <span
                          className={
                            manufacturer.is_approved
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {manufacturer.is_approved
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      {/* ACTION */}
                      <td>

                        <div className="action-buttons">

                          {/* SINGLE APPROVAL */}
                          {/* <button
                            type="button"
                            className="action-button approval"
                            onClick={() =>
                              handleApprovalToggle(
                                manufacturer
                              )
                            }
                            title="Publish"
                          >
                            <Upload size={17} />
                          </button> */}

                          {/* VIEW */}

                          {/*
                          <button
                            type="button"
                            className="action-button view"
                            onClick={() =>
                              handleView(manufacturer)
                            }
                            title="View Details"
                          >
                            <Eye size={17} />
                          </button>
                          */}

                          {/* EDIT */}

                          {/*
                          <button
                            type="button"
                            className="action-button edit"
                            onClick={() =>
                              handleEdit(manufacturer)
                            }
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>
                          */}

                          {/* SINGLE DELETE */}
                          <button
                            type="button"
                            className="action-button delete"
                            onClick={() =>
                              handleDeleteClick(
                                manufacturer
                              )
                            }
                            title="Delete"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

            <div className="pagination">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev - 1
                  )
                }
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of{" "}
                {totalPages || 1}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (prev) => prev + 1
                  )
                }
                disabled={
                  currentPage >= totalPages
                }
              >
                Next
              </button>

            </div>

          </div>
        )}

      </div>

      {/* VIEW DETAILS MODAL */}
      {showViewModal && selectedManufacturer && (

        <div
          className="modal-overlay manufacturer-details-overlay"
          onClick={() =>
            setShowViewModal(false)
          }
        >

          <div
            className="manufacturer-details-page"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* PAGE HEADER */}
            <div className="manufacturer-details-header">

              <div>

                <span className="details-breadcrumb">
                  Manufacturer Management / Details
                </span>

                <h2>
                  Manufacturer Details
                </h2>

                <p>
                  Complete information about this
                  manufacturer
                </p>

              </div>

              <button
                type="button"
                className="details-page-close"
                onClick={() =>
                  setShowViewModal(false)
                }
                title="Close"
              >
                <X size={21} />
              </button>

            </div>

            {/* PAGE CONTENT */}
            <div className="manufacturer-details-body">

              {/* PROFILE CARD */}
              <div className="manufacturer-profile-card">

                <div className="manufacturer-profile-logo">

                  {selectedManufacturer.logo ? (

                    <img
                      src={selectedManufacturer.logo}
                      alt={
                        selectedManufacturer.company_name
                      }
                    />

                  ) : (

                    <Building2 size={45} />

                  )}

                </div>

                <div className="manufacturer-profile-info">

                  <h1>
                    {selectedManufacturer.company_name ||
                      "-"}
                  </h1>

                  <p>
                    Manufacturer ID:{" "}
                    <span>
                      {selectedManufacturer.id || "-"}
                    </span>
                  </p>

                  <span
                    className={
                      selectedManufacturer.is_approved
                        ? "details-status active"
                        : "details-status inactive"
                    }
                  >
                    {selectedManufacturer.is_approved
                      ? "Approved"
                      : "Not Approved"}
                  </span>

                </div>

              </div>

              {/* BASIC INFORMATION */}
              <div className="details-page-section">

                <div className="details-section-heading">

                  <h3>
                    Basic Information
                  </h3>

                  <p>
                    General manufacturer information
                  </p>

                </div>

                <div className="details-information-grid">

                  <DetailItem
                    icon={<MapPin size={18} />}
                    label="Headquarter"
                    value={
                      selectedManufacturer.headquarter
                    }
                  />

                  <DetailItem
                    icon={<CalendarDays size={18} />}
                    label="Founding Date"
                    value={
                      selectedManufacturer.founding_date
                    }
                  />

                  <DetailItem
                    icon={<FileText size={18} />}
                    label="Licence Type"
                    value={
                      selectedManufacturer.licence_type
                    }
                  />

                  <DetailItem
                    icon={<User size={18} />}
                    label="Author Name"
                    value={
                      selectedManufacturer.author_name
                    }
                  />

                </div>

              </div>

              {/* COMPANY DESCRIPTION */}
              <div className="details-page-section">

                <div className="details-section-heading">

                  <h3>
                    Company Description
                  </h3>

                  <p>
                    About the manufacturer
                  </p>

                </div>

                <div className="details-text-card">

                  <p>
                    {selectedManufacturer.company_description ||
                      "No description available."}
                  </p>

                </div>

              </div>

              {/* COMPANY HISTORY */}
              <div className="details-page-section">

                <div className="details-section-heading">

                  <h3>
                    Company History
                  </h3>

                  <p>
                    Manufacturer history and background
                  </p>

                </div>

                <div className="details-text-card">

                  <p>
                    {selectedManufacturer.company_history ||
                      "No company history available."}
                  </p>

                </div>

              </div>

              {/* WIKI */}
              {selectedManufacturer.wiki_link && (

                <div className="details-page-section">

                  <div className="details-section-heading">

                    <h3>
                      Additional Information
                    </h3>

                    <p>
                      External reference
                    </p>

                  </div>

                  <a
                    href={
                      selectedManufacturer.wiki_link
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="details-wiki-link"
                  >

                    <ExternalLink size={17} />

                    <span>
                      View Manufacturer Wiki
                    </span>

                    <ExternalLink size={14} />

                  </a>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

      {/* SINGLE DELETE MODAL */}
      {showDeleteModal && selectedManufacturer && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowDeleteModal(false)
          }
        >

          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="delete-modal-close"
              onClick={() =>
                setShowDeleteModal(false)
              }
            >
              <X size={20} />
            </button>

            <div className="delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>
              Delete Manufacturer?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {selectedManufacturer.company_name}
              </strong>
              ?
              <br />
            </p>

            <div className="delete-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 size={16} />

                {deleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ALL MANUFACTURERS MODAL */}
      {showAllManufacturerModal && (

        <div
          className="modal-overlay manufacturer-details-overlay"
          onClick={() =>
            setShowAllManufacturerModal(false)
          }
        >

          <div
            className="manufacturer-details-page"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* PAGE HEADER */}
            <div className="manufacturer-details-header">

              <div>

                <h2>
                  All Manufacturers
                </h2>

              </div>

              <button
                type="button"
                className="details-page-close"
                onClick={() =>
                  setShowAllManufacturerModal(false)
                }
                title="Close"
              >
                <X size={21} />
              </button>

            </div>

            {/* PAGE CONTENT */}
            <div className="manufacturer-details-body">

              <div className="details-page-section">

                <div className="details-section-heading">

                  <h3>
                    Manufacturers Listing
                  </h3>

                  <p>
                    Total {allManufacturers.length} manufacturers
                  </p>

                </div>

                {listLoading ? (

                  <div className="empty-state">

                    <RefreshCw
                      size={30}
                      className="loading-icon"
                    />

                    <p>
                      Loading manufacturers...
                    </p>

                  </div>

                ) : allManufacturers.length === 0 ? (

                  <div className="empty-state">

                    <Building2 size={35} />

                    <h3>
                      No manufacturers found
                    </h3>

                  </div>

                ) : (

                  <div className="table-container">

                    <table className="manufacturer-table">

                      <thead>

                        <tr>

                          <th>
                            S.No.
                          </th>

                          <th>
                            Manufacturer Name
                          </th>

                          <th>
                            Logo
                          </th>

                          <th>
                            Status
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {allManufacturers.map(
                          (manufacturer, index) => (

                            <tr
                              key={
                                manufacturer.id ||
                                index
                              }
                            >

                              <td className="serial-number">
                                {index + 1}
                              </td>

                              <td>

                                <strong className="company-name-text">
                                  {manufacturer.company_name ||
                                    "-"}
                                </strong>

                              </td>

                              <td>

                                <div className="logo-wrapper">

                                  {manufacturer.logo ? (

                                    <img
                                      src={
                                        manufacturer.logo
                                      }
                                      alt={
                                        manufacturer.company_name ||
                                        "Manufacturer Logo"
                                      }
                                      className="manufacturer-logo"
                                    />

                                  ) : (

                                    <Building2
                                      size={20}
                                      color="#94a3b8"
                                    />

                                  )}

                                </div>

                              </td>

                              <td>

                                <span
                                  className={
                                    manufacturer.is_approved
                                      ? "status-active"
                                      : "status-inactive"
                                  }
                                >
                                  {manufacturer.is_approved
                                    ? "Active"
                                    : "Inactive"}
                                </span>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      )}

      {/* BULK DELETE MODAL */}
      {showBulkDeleteModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowBulkDeleteModal(false)
          }
        >

          <div
            className="delete-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="delete-modal-close"
              onClick={() =>
                setShowBulkDeleteModal(false)
              }
            >
              <X size={20} />
            </button>

            <div className="delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>
              Delete Manufacturers?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {selectedIds.length} manufacturer(s)
              </strong>
              ?
              <br />

              {/* This action cannot be undone. */}
            </p>

            <div className="delete-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setShowBulkDeleteModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
              >
                <Trash2 size={16} />

                {bulkDeleteLoading
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
}) => (
  <div className="detail-item">

    <div className="detail-item-icon">
      {icon}
    </div>

    <div>

      <span>
        {label}
      </span>

      <strong>
        {value || "-"}
      </strong>

    </div>

  </div>
);

export default ManufacturerManagement;