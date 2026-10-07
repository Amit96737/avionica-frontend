import { useEffect, useRef, useState } from "react";

import {
  Upload,
  Search,
  ChevronDown,
  X,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Plane,
} from "lucide-react";

import "../../src/App.css";

import { API_BASE_URL } from "../../src/constants";


const AIRCRAFT_LIST_API = `${API_BASE_URL}/aircraft/aircraft-details/`;
const AIRCRAFT_DELETE_API = `${API_BASE_URL}/aircraft/delete-aircraft/`;
const AIRCRAFT_BULK_DELETE_API = `${API_BASE_URL}/aircraft/bulk-delete-aircraft/`;
const AIRCRAFT_BULK_APPROVE_API =`${API_BASE_URL}/aircraft/bulk-approve-aircraft/`;
const AIRCRAFT_BULK_DISAPPROVE_API =`${API_BASE_URL}/aircraft/bulk-disapprove-aircraft/`;

const AircraftManagement = () => {

  const [manufacturers, setManufacturers] = useState([]);
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [showManufacturerDropdown, setShowManufacturerDropdown] =
    useState(false);


  const [files, setFiles] = useState([]);


  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingAircraft, setLoadingAircraft] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==============================
  // AIRCRAFT STATES
  // ==============================
  const [aircrafts, setAircrafts] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // ==============================
  // BULK DELETE STATES
  // ==============================
  const [selectedAircraftIds, setSelectedAircraftIds] = useState([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);
  const [bulkDisapproveLoading, setBulkDisapproveLoading] = useState(false);

  const dropdownRef = useRef(null);

  const selectedAircraftRecords = aircrafts.filter((aircraft) =>
    selectedAircraftIds.includes(aircraft.id)
  );

  const allSelectedApproved =
    selectedAircraftRecords.length > 0 &&
    selectedAircraftRecords.every(
      (aircraft) => aircraft.is_approved === true
    );

  const allSelectedDisapproved =
    selectedAircraftRecords.length > 0 &&
    selectedAircraftRecords.every(
      (aircraft) => aircraft.is_approved === false
    );

  // ============================================================
  // FETCH ALL MANUFACTURERS
  // ============================================================
  const fetchManufacturers = async () => {
    try {
      setLoadingManufacturers(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/manufacturer/manufacturer-details/`
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

      setManufacturers(manufacturersData);
    } catch (err) {
      console.error("Error fetching manufacturers:", err);

      setError(
        err.message || "Failed to fetch manufacturers."
      );
    } finally {
      setLoadingManufacturers(false);
    }
  };

  // ============================================================
  // FETCH AIRCRAFT LIST
  // ============================================================
  const fetchAircrafts = async () => {
    try {
      setLoadingAircraft(true);

      const response = await fetch(AIRCRAFT_LIST_API, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch aircraft."
        );
      }

      const aircraftData = Array.isArray(data)
        ? data
        : data?.data || data?.aircrafts || [];

      setAircrafts(aircraftData);

      // After refreshing list, start from first page.
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching aircraft:", err);

      setError(
        err.message || "Failed to fetch aircraft."
      );
    } finally {
      setLoadingAircraft(false);
    }
  };

  // ============================================================
  // PAGE LOAD
  // ============================================================
  useEffect(() => {
    fetchManufacturers();
    fetchAircrafts();
  }, []);

  // ============================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowManufacturerDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleAircraftApprovalToggle = async (aircraft) => {
  if (!aircraft?.id) {
    return;
  }

  try {
    setMessage("");
    setError("");

    const response = await fetch(
      `${API_BASE_URL}/aircraft/update-aircraft/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          aircraft_id: aircraft.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.message ||
          "Failed to update aircraft status."
      );
    }

    setMessage(
      data?.message ||
        "Aircraft status updated successfully."
    );

    await fetchAircrafts();
  } catch (err) {
    console.error(
      "Aircraft Approval Toggle Error:",
      err
    );

    setError(
      err.message ||
        "Failed to update aircraft status."
    );
  }
};

const handleBulkApprove = async () => {
  if (!selectedAircraftIds.length) {
    return;
  }

  const idsToApprove = [...selectedAircraftIds];

  try {
    setBulkApproveLoading(true);
    setMessage("");
    setError("");

    const response = await fetch(
      AIRCRAFT_BULK_APPROVE_API,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          aircraft_ids: idsToApprove,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.message ||
          "Failed to approve aircraft."
      );
    }

    // UI IMMEDIATELY ACTIVE
    setAircrafts((prev) =>
      prev.map((aircraft) =>
        idsToApprove.includes(aircraft.id)
          ? {
              ...aircraft,
              is_approved: true,
            }
          : aircraft
      )
    );

    // Selection clear
    setSelectedAircraftIds([]);

    // Response milte hi message
    setMessage(
      data?.message ||
        `${idsToApprove.length} aircraft approved successfully.`
    );

    // IMPORTANT
    // No fetchAircrafts() here

    setBulkApproveLoading(false);

  } catch (err) {
    console.error("Bulk Approve Error:", err);

    setError(
      err.message ||
        "Failed to approve aircraft."
    );

    setBulkApproveLoading(false);
  }
};


const handleBulkDisapprove = async () => {
  if (!selectedAircraftIds.length) {
    return;
  }

  try {
    setBulkDisapproveLoading(true);
    setMessage("");
    setError("");

    const response = await fetch(
      AIRCRAFT_BULK_DISAPPROVE_API,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          aircraft_ids: selectedAircraftIds,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.message ||
          "Failed to disapprove aircraft."
      );
    }

    setSelectedAircraftIds([]);

    setMessage(
      data?.message ||
        "Aircraft disapproved successfully."
    );

    await fetchAircrafts();
  } catch (err) {
    console.error(
      "Bulk Disapprove Error:",
      err
    );

    setError(
      err.message ||
        "Failed to disapprove aircraft."
    );
  } finally {
    setBulkDisapproveLoading(false);
  }
};


  // ============================================================
  // MANUFACTURER SEARCH
  // ============================================================
  const filteredManufacturers = manufacturers.filter(
    (manufacturer) =>
      manufacturer.company_name
        ?.toLowerCase()
        .includes(manufacturerSearch.toLowerCase())
  );

  // ============================================================
  // SELECT MANUFACTURER
  // ============================================================
  const handleSelectManufacturer = (manufacturer) => {
    setSelectedManufacturer(manufacturer);

    setManufacturerSearch(
      manufacturer.company_name || ""
    );

    setShowManufacturerDropdown(false);
    setMessage("");
    setError("");
  };

  // ============================================================
  // MANUFACTURER SEARCH CHANGE
  // ============================================================
  const handleManufacturerSearch = (event) => {
    const value = event.target.value;

    setManufacturerSearch(value);
    setShowManufacturerDropdown(true);

    if (
      selectedManufacturer &&
      value !== selectedManufacturer.company_name
    ) {
      setSelectedManufacturer(null);
    }
  };

  // ============================================================
  // FILE CHANGE
  // ============================================================
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    setMessage("");
    setError("");

    const jsonFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/json" ||
        file.name.toLowerCase().endsWith(".json")
    );

    if (jsonFiles.length !== selectedFiles.length) {
      setError("Only JSON files are allowed.");
    }

    setFiles(jsonFiles);
  };

  // ============================================================
  // REMOVE SINGLE FILE
  // ============================================================
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) =>
      prev.filter(
        (_, index) => index !== indexToRemove
      )
    );
  };

  // ============================================================
  // CLEAR ALL FILES
  // ============================================================
  const handleClearFiles = () => {
    setFiles([]);

    const fileInput = document.getElementById(
      "aircraftJsonFiles"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUpload = async () => {
    setMessage("");
    setError("");

    // Manufacturer validation
    if (!selectedManufacturer?.id) {
      setError("Please select a manufacturer.");
      return;
    }

    // File validation
    if (files.length === 0) {
      setError("Please select at least one JSON file.");
      return;
    }

    try {
      const formData = new FormData();

      // Manufacturer ID
      formData.append(
        "manufacturer_id",
        selectedManufacturer.id
      );

      // Multiple JSON files
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `${API_BASE_URL}/aircraft/upload-json`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to start aircraft upload."
        );
      }

      // setMessage(
      //   data?.message ||
      //     "Aircraft upload started in background."
      // );

      // Clear selected files
      setFiles([]);

      const fileInput = document.getElementById(
        "aircraftJsonFiles"
      );

      if (fileInput) {
        fileInput.value = "";
      }

      if (data?.task_id) {
        const taskId = data.task_id;

        const checkUploadStatus = async () => {
          try {
            const statusResponse = await fetch(
              `${API_BASE_URL}/aircraft/upload-json-status/${taskId}`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            const statusData = await statusResponse.json();

            if (!statusResponse.ok) {
              throw new Error(
                statusData?.detail ||
                  "Failed to check aircraft upload status."
              );
            }

            if (statusData.status === "processing") {
              setTimeout(checkUploadStatus, 2000);
              return;
            }

            if (statusData.status === "completed") {
              setMessage(
                statusData.message ||
                  "Aircraft upload completed."
              );

              await fetchAircrafts();

              return;
            }

            if (statusData.status === "failed") {
              setError(
                statusData.message ||
                  "Aircraft upload failed."
              );

              await fetchAircrafts();

              return;
            }

          } catch (err) {
            console.error(
              "Aircraft Upload Status Error:",
              err
            );
          }
        };

        checkUploadStatus();
      }

    } catch (err) {
      console.error(
        "Aircraft Upload Error:",
        err
      );

      setError(
        err.message ||
          "Failed to start aircraft upload."
      );
    }
  };


  const handleDeleteClick = (aircraft) => {
    setSelectedAircraft(aircraft);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedAircraft?.id) {
      return;
    }

    try {
      setDeleteLoading(true);
      setMessage("");
      setError("");

      const response = await fetch(
        AIRCRAFT_DELETE_API,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            aircraft_id: selectedAircraft.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to delete aircraft."
        );
      }

      setShowDeleteModal(false);
      setSelectedAircraft(null);

      setMessage(
        data?.message ||
          "Aircraft deleted successfully."
      );

      // Refresh aircraft list after delete
      await fetchAircrafts();
    } catch (err) {
      console.error("Aircraft Delete Error:", err);

      setError(
        err.message ||
          "Failed to delete aircraft."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(
    aircrafts.length / recordsPerPage
  );

  const startIndex =
    (currentPage - 1) * recordsPerPage;

  const paginatedAircrafts = aircrafts.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  // ============================================================
  // SELECT AIRCRAFT
  // ============================================================
  const handleAircraftSelect = (aircraftId) => {
    setSelectedAircraftIds((prev) =>
      prev.includes(aircraftId)
        ? prev.filter(
            (id) => id !== aircraftId
          )
        : [...prev, aircraftId]
    );
  };

  // ============================================================
  // SELECT ALL AIRCRAFT
  // ============================================================
  const handleSelectAllAircraft = () => {
    if (
      selectedAircraftIds.length ===
      aircrafts.length
    ) {
      setSelectedAircraftIds([]);
    } else {
      setSelectedAircraftIds(
        aircrafts.map(
          (aircraft) => aircraft.id
        )
      );
    }
  };

  // ============================================================
  // BULK DELETE AIRCRAFT
  // ============================================================
  const handleBulkDelete = async () => {
    if (!selectedAircraftIds.length) {
      return;
    }

    try {
      setBulkDeleteLoading(true);
      setMessage("");
      setError("");

      const response = await fetch(
        AIRCRAFT_BULK_DELETE_API,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            aircraft_ids: selectedAircraftIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to delete aircraft."
        );
      }

      setSelectedAircraftIds([]);

      setMessage(
        data?.message ||
          "Aircraft deleted successfully."
      );

      await fetchAircrafts();
    } catch (err) {
      console.error(
        "Bulk Aircraft Delete Error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete aircraft."
      );
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // ============================================================
  // PAGE CHANGE
  // ============================================================
  const handlePreviousPage = () => {
    setCurrentPage((prev) =>
      Math.max(prev - 1, 1)
    );
  };

  const handleNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, totalPages)
    );
  };

  return (
    <div className="manufacturer-page aircraft-page">

      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="manufacturer-header-banner">
        <h1>Aircraft Management</h1>
      </div>

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}
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

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}
      {error && (
        <div className="error-message">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================================
          UPLOAD CARD
      ====================================================== */}
      <div className="upload-card aircraft-upload-card">

        <div className="upload-area aircraft-upload-area">

          {/* ==================================================
              MANUFACTURER
          ================================================== */}
          <div
            className="aircraft-manufacturer-dropdown"
            ref={dropdownRef}
          >
            <label className="aircraft-form-label">
              Aircraft Manufacturer
            </label>

            <div className="aircraft-dropdown-wrapper">

              <Search
                size={17}
                className="aircraft-search-icon"
              />

              <input
                type="text"
                value={manufacturerSearch}
                placeholder={
                  loadingManufacturers
                    ? "Loading Manufacturers..."
                    : "Search Manufacturer..."
                }
                onChange={handleManufacturerSearch}
                onFocus={() =>
                  setShowManufacturerDropdown(true)
                }
                disabled={loadingManufacturers}
                className="aircraft-manufacturer-input"
              />

              <ChevronDown
                size={18}
                className="aircraft-dropdown-icon"
                onClick={() =>
                  setShowManufacturerDropdown(
                    (prev) => !prev
                  )
                }
              />

            </div>

            {/* DROPDOWN OPTIONS */}
            {showManufacturerDropdown && (
              <div className="aircraft-manufacturer-options">

                {loadingManufacturers ? (
                  <div className="aircraft-dropdown-loading">

                    <Loader2
                      size={17}
                      className="loading-icon"
                    />

                    <span>
                      Loading manufacturers...
                    </span>

                  </div>
                ) : filteredManufacturers.length === 0 ? (

                  <div className="aircraft-dropdown-empty">
                    <span>
                      No manufacturers found
                    </span>
                  </div>

                ) : (

                  filteredManufacturers.map(
                    (manufacturer) => (

                      <button
                        type="button"
                        key={manufacturer.id}
                        className={
                          selectedManufacturer?.id ===
                          manufacturer.id
                            ? "aircraft-manufacturer-option selected"
                            : "aircraft-manufacturer-option"
                        }
                        onClick={() =>
                          handleSelectManufacturer(
                            manufacturer
                          )
                        }
                      >
                        <span>
                          {manufacturer.company_name ||
                            "-"}
                        </span>
                      </button>

                    )
                  )

                )}

              </div>
            )}

          </div>

          {/* ==================================================
              SELECTED MANUFACTURER
          ================================================== */}
          {selectedManufacturer && (
            <div className="aircraft-selected-manufacturer">

              <span>
                {selectedManufacturer.company_name}
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedManufacturer(null);
                  setManufacturerSearch("");
                }}
                title="Remove manufacturer"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {/* ==================================================
              FILE + UPLOAD ROW
          ================================================== */}
          <div className="aircraft-file-upload-row">

            {/* JSON FILE SELECT */}
            <div className="aircraft-file-section">

              <label className="aircraft-form-label">
                Select Aircraft JSON Files
              </label>

              <div className="file-input-wrapper">

                <input
                  id="aircraftJsonFiles"
                  type="file"
                  accept=".json,application/json"
                  multiple
                  onChange={handleFileChange}
                />

                <label
                  htmlFor="aircraftJsonFiles"
                  className="file-custom-label"
                >
                  <FileJson size={17} />

                  <span>
                    {files.length > 0
                      ? `${files.length} JSON file(s) selected`
                      : "Choose JSON files"}
                  </span>
                </label>

              </div>

            </div>

            {/* UPLOAD BUTTON */}
            <button
              type="button"
              className="upload-button aircraft-upload-button"
              onClick={handleUpload}
              disabled={
                !selectedManufacturer ||
                files.length === 0
              }
            >
              <Upload size={17} />
              Upload Aircraft
            </button>

          </div>

          {/* ==================================================
              SELECTED FILES
          ================================================== */}
          {files.length > 0 && (
            <div className="aircraft-files-list">

              <div className="aircraft-files-header">

                <strong>
                  Selected Files ({files.length})
                </strong>

                <button
                  type="button"
                  onClick={handleClearFiles}
                >
                  Clear All
                </button>

              </div>

              <div className="aircraft-file-items">

                {files.map((file, index) => (

                  <div
                    className="aircraft-file-item"
                    key={`${file.name}-${index}`}
                  >

                    <div className="aircraft-file-name">

                      <FileJson size={16} />

                      <span title={file.name}>
                        {file.name}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveFile(index)
                      }
                      title="Remove file"
                    >
                      <X size={15} />
                    </button>

                  </div>

                ))}

              </div>

            </div>
          )}

        </div>
      </div>

      {/* ======================================================
          AIRCRAFT LIST
      ====================================================== */}
      <div className="manufacturer-list aircraft-list">

        <div className="list-header">

          <div className="aircraft-list-header">
            <h2>Aircraft List</h2>

            <div className="aircraft-action-buttons">
              <button
                type="button"
                className={
                  selectedAircraftIds.length === 0 || allSelectedDisapproved
                    ? "disapprove-btn action-btn-disabled"
                    : "disapprove-btn action-btn-active"
                }
                onClick={handleBulkDisapprove}
                disabled={
                  selectedAircraftIds.length === 0 ||
                  allSelectedDisapproved ||
                  bulkApproveLoading ||
                  bulkDisapproveLoading ||
                  bulkDeleteLoading
                }
              >
                {bulkDisapproveLoading ? (
                  <>
                    <Loader2
                      size={16}
                      className="loading-icon"
                    />
                    Disapproving...
                  </>
                ) : (
                  <>
                    Disapprove
                    {selectedAircraftIds.length
                      ? ` (${selectedAircraftIds.length})`
                      : ""}
                  </>
                )}
              </button>

              <button
                type="button"
                className={
                  selectedAircraftIds.length === 0 || allSelectedApproved
                    ? "approve-btn action-btn-disabled"
                    : "approve-btn action-btn-active"
                }
                onClick={handleBulkApprove}
                disabled={
                  selectedAircraftIds.length === 0 ||
                  allSelectedApproved ||
                  bulkApproveLoading ||
                  bulkDisapproveLoading ||
                  bulkDeleteLoading
                }
              >
                {bulkApproveLoading ? (
                  <>
                    <Loader2
                      size={16}
                      className="loading-icon"
                    />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Approve
                    {selectedAircraftIds.length
                      ? ` (${selectedAircraftIds.length})`
                      : ""}
                  </>
                )}
              </button>

              <button
                type="button"
                className={
                  selectedAircraftIds.length > 0
                    ? "delete-all-btn action-btn-delete"
                    : "delete-all-btn action-btn-delete-disabled"
                }
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={
                  selectedAircraftIds.length === 0 ||
                  bulkDeleteLoading
                }
              >
                {bulkDeleteLoading
                  ? "Deleting..."
                  : `Delete${
                      selectedAircraftIds.length
                        ? ` (${selectedAircraftIds.length})`
                        : ""
                    }`}
              </button>
            </div>
          </div>

          <div className="manufacturer-counts">

            <div className="count-item">

              <span>Total</span>

              <strong>
                {aircrafts.length}
              </strong>

            </div>

          </div>

        </div>

        {/* ==================================================
            AIRCRAFT TABLE
        ================================================== */}
        {loadingAircraft ? (

          <div className="empty-state">

            <RefreshAircraftLoader />

            <p>
              Loading aircraft....
            </p>

          </div>

        ) : aircrafts.length === 0 ? (

          <div className="empty-state">

            <Plane size={35} />

            <h3>
              No aircraft found
            </h3>

          </div>

        ) : (

          <>

            <div className="table-container">

              <table className="manufacturer-table aircraft-table">

                <thead>

                  <tr>

                    {/* SELECT ALL */}
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          aircrafts.length > 0 &&
                          selectedAircraftIds.length ===
                            aircrafts.length
                        }
                        onChange={
                          handleSelectAllAircraft
                        }
                      />
                    </th>

                    <th>Sno</th>

                    <th>Image</th>

                    <th>Model</th>

                    <th>ICAO</th>

                    <th>Manufacturer</th>

                    <th>Status</th>

                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedAircrafts.map(
                    (aircraft, index) => (

                      <tr key={aircraft.id}>

                        {/* CHECKBOX */}
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedAircraftIds.includes(
                              aircraft.id
                            )}
                            onChange={() =>
                              handleAircraftSelect(
                                aircraft.id
                              )
                            }
                          />
                        </td>

                        {/* SNO */}
                        <td>
                          {(currentPage - 1) *
                            recordsPerPage +
                            index +
                            1}
                        </td>

                        {/* IMAGE */}
                        <td>
                          <div className="logo-wrapper aircraft-image-wrapper">
                            <img
                              src={
                                Array.isArray(aircraft.images)
                                  ? aircraft.images.find(
                                      (image) => image.is_default === true
                                    )?.url ||
                                    "https://d3p4qddo22chul.cloudfront.net/manufacturer/fi_corp.svg"
                                  : "https://d3p4qddo22chul.cloudfront.net/manufacturer/fi_corp.svg"
                              }
                              alt={
                                aircraft.Aircraft_Model ||
                                "Aircraft"
                              }
                              className="manufacturer-logo aircraft-image"
                            />
                          </div>
                        </td>

                        {/* MODEL */}
                        <td>
                          {aircraft.Aircraft_Model ||
                            "-"}
                        </td>

                        {/* ICAO */}
                        <td>
                          {aircraft.ICAO_Type_Code ||
                            "-"}
                        </td>

                        {/* MANUFACTURER */}
                        <td>
                          {aircraft.manufacturer
                            ?.company_name || "-"}
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={
                              aircraft.is_approved
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {aircraft.is_approved ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* ACTION */}
                        <td>

                          {/* <button
                            type="button"
                            className="action-button approval"
                            onClick={() =>
                              handleAircraftApprovalToggle(aircraft)
                            }
                            title={
                              aircraft.is_approved
                                ? "Disapprove"
                                : "Publish"
                            }
                          >
                            <Upload size={17} />
                          </button> */}

                          <button
                            type="button"
                            className="action-delete-button"
                            onClick={() =>
                              handleDeleteClick(
                                aircraft
                              )
                            }
                            title="Delete Aircraft"
                          >
                            <Trash2 size={17} />
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}
            <div className="pagination">

              <button
                type="button"
                onClick={handlePreviousPage}
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
                onClick={handleNextPage}
                disabled={
                  currentPage >= totalPages
                }
              >
                Next
              </button>

            </div>

          </>

        )}

      </div>

      {/* ======================================================
          DELETE MODAL
      ====================================================== */}
      {showDeleteModal && selectedAircraft && (

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
              Delete Aircraft?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {selectedAircraft.Aircraft_Model ||
                  "this aircraft"}
              </strong>
              ?
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

      {/* ======================================================
        BULK DELETE MODAL
      ====================================================== */}
      {showBulkDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowBulkDeleteModal(false)}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="delete-modal-close"
              onClick={() => setShowBulkDeleteModal(false)}
            >
              <X size={20} />
            </button>

            <div className="delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>
              Delete Aircraft?
            </h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {selectedAircraftIds.length} selected aircraft
              </strong>
              ?
            </p>

            <div className="delete-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={async () => {
                  await handleBulkDelete();
                  setShowBulkDeleteModal(false);
                }}
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

// ============================================================
// LOADING ICON
// ============================================================
const RefreshAircraftLoader = () => {
  return (
    <Loader2
      size={30}
      className="loading-icon"
    />
  );
};

export default AircraftManagement;