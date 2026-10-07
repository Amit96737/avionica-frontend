import { useEffect, useState } from "react";
import {
  Upload,
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


const AIRPORT_LIST_API = `${API_BASE_URL}/airport/airport-details/`;
const AIRPORT_DELETE_API = `${API_BASE_URL}/airport/delete-airport/`;
const AIRPORT_BULK_DELETE_API = `${API_BASE_URL}/airport/bulk-delete-airport/`;
const AIRPORT_BULK_APPROVE_API = `${API_BASE_URL}/airport/bulk-approve-airport/`;
const AIRPORT_BULK_DISAPPROVE_API = `${API_BASE_URL}/airport/bulk-disapprove-airport/`;


const AirportManagement = () => {

  const [files, setFiles] = useState([]);

  const [uploading, setUploading] = useState(false);

  const [uploadTaskId, setUploadTaskId] = useState(null);


  const [airports, setAirports] = useState([]);

  const [loadingAirport, setLoadingAirport] = useState(false);

  const [selectedAirport, setSelectedAirport] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const [selectedAirportIds, setSelectedAirportIds] = useState([]);

  const [bulkDeleteLoading, setBulkDeleteLoading] =
    useState(false);

  const [bulkApproveLoading, setBulkApproveLoading] =
    useState(false);

  const [bulkDisapproveLoading, setBulkDisapproveLoading] =
    useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showBulkDeleteModal, setShowBulkDeleteModal] =
    useState(false);


  const [message, setMessage] = useState("");

  const [error, setError] = useState("");


  const [currentPage, setCurrentPage] = useState(1);

  const recordsPerPage = 15;


  const selectedAirportRecords = airports.filter((airport) =>
    selectedAirportIds.includes(airport.id)
  );

  const allSelectedApproved =
    selectedAirportRecords.length > 0 &&
    selectedAirportRecords.every(
      (airport) => airport.is_approved === true
    );

  const allSelectedDisapproved =
    selectedAirportRecords.length > 0 &&
    selectedAirportRecords.every(
      (airport) => airport.is_approved === false
    );


  const fetchAirports = async () => {

    try {

      setLoadingAirport(true);

      setError("");

      const response = await fetch(AIRPORT_LIST_API, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to fetch airports."
        );
      }

      const airportData = Array.isArray(data)
        ? data
        : data?.data ||
          data?.airports ||
          [];

      setAirports(airportData);

      setCurrentPage(1);

    } catch (err) {

      console.error(
        "Error fetching airports:",
        err
      );

      setError(
        err.message ||
          "Failed to fetch airports."
      );

    } finally {

      setLoadingAirport(false);

    }
  };


  useEffect(() => {

    fetchAirports();

  }, []);


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


  const handleRemoveFile = (indexToRemove) => {

    setFiles((prev) =>
      prev.filter(
        (_, index) => index !== indexToRemove
      )
    );

  };


  const handleClearFiles = () => {

    setFiles([]);

    const fileInput = document.getElementById(
      "airportJsonFiles"
    );

    if (fileInput) {

      fileInput.value = "";

    }

  };


  const checkAirportUploadStatus = async (taskId) => {

    try {

      const response = await fetch(
        `${API_BASE_URL}/airport/upload-airport-json-status/${taskId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to check upload status."
        );

      }

      if (data.status === "completed") {

        setUploading(false);

        setUploadTaskId(null);

        if (
          data?.already_exists_files &&
          data.already_exists_files.length > 0
        ) {

          setMessage(
            `${data.already_exists_files.join(
              ", "
            )} already exists.`
          );

        } else {

          setMessage(
            data?.message ||
              `Airport upload completed. Inserted: ${
                data?.inserted_count || 0
              }`
          );

        }

        setAirports(data?.inserted_airports || []);

        setCurrentPage(1);

        return;
      }

      if (data.status === "failed") {

        setUploading(false);

        setUploadTaskId(null);

        setError(
          data?.message ||
            "Airport upload failed."
        );

        return;

      }

      setTimeout(() => {

        checkAirportUploadStatus(taskId);

      }, 1000);

    } catch (err) {

      console.error(
        "Airport Upload Status Error:",
        err
      );

      setUploading(false);

      setUploadTaskId(null);

      setError(
        err.message ||
          "Failed to check airport upload status."
      );

    }

  };


  const handleUpload = async () => {

    setMessage("");

    setError("");

    if (files.length === 0) {

      setError(
        "Please select at least one JSON file."
      );

      return;

    }

    try {

      setUploading(true);

      const formData = new FormData();

      files.forEach((file) => {

        formData.append("files", file);

      });

      const response = await fetch(
        `${API_BASE_URL}/airport/upload-airport-json`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {

        let errorMessage =
          data?.detail ||
          data?.message ||
          "Failed to upload airport JSON file.";

        if (Array.isArray(errorMessage)) {

          errorMessage = errorMessage
            .map((item) =>
              typeof item === "string"
                ? item
                : item?.msg || "Invalid file"
            )
            .join(", ");

        }

        throw new Error(errorMessage);

      }

      const taskId = data?.task_id;

      if (!taskId) {

        throw new Error(
          "Upload task ID was not received."
        );

      }

      setUploadTaskId(taskId);

      setFiles([]);

      const fileInput = document.getElementById(
        "airportJsonFiles"
      );

      if (fileInput) {

        fileInput.value = "";

      }

      setMessage(
        data?.message ||
          "Airport upload started in background."
      );

      checkAirportUploadStatus(taskId);

    } catch (err) {

      console.error(
        "Airport Upload Error:",
        err
      );

      setError(
        err.message ||
          "Failed to start airport upload."
      );

      setUploading(false);

    }

  };


  const handleAirportSelect = (airportId) => {

    setSelectedAirportIds((prev) =>
      prev.includes(airportId)
        ? prev.filter(
            (id) => id !== airportId
          )
        : [...prev, airportId]
    );

  };


  const handleSelectAllAirport = () => {

    if (
      selectedAirportIds.length ===
      airports.length
    ) {

      setSelectedAirportIds([]);

    } else {

      setSelectedAirportIds(
        airports.map(
          (airport) => airport.id
        )
      );

    }

  };


  const handleBulkApprove = async () => {

    if (!selectedAirportIds.length) {

      return;

    }

    const idsToApprove = [
      ...selectedAirportIds,
    ];

    try {

      setBulkApproveLoading(true);

      setMessage("");

      setError("");

      const response = await fetch(
        AIRPORT_BULK_APPROVE_API,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            airport_ids: idsToApprove,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to approve airports."
        );

      }

      setAirports((prev) =>
        prev.map((airport) =>
          idsToApprove.includes(
            airport.id
          )
            ? {
                ...airport,
                is_approved: true,
              }
            : airport
        )
      );

      setSelectedAirportIds([]);

      setMessage(
        data?.message ||
          `${idsToApprove.length} airport(s) approved successfully.`
      );

    } catch (err) {

      console.error(
        "Bulk Airport Approve Error:",
        err
      );

      setError(
        err.message ||
          "Failed to approve airports."
      );

    } finally {

      setBulkApproveLoading(false);

    }

  };


  const handleBulkDisapprove = async () => {

    if (!selectedAirportIds.length) {

      return;

    }

    const idsToDisapprove = [
      ...selectedAirportIds,
    ];

    try {

      setBulkDisapproveLoading(true);

      setMessage("");

      setError("");

      const response = await fetch(
        AIRPORT_BULK_DISAPPROVE_API,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            airport_ids: idsToDisapprove,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to disapprove airports."
        );

      }

      setAirports((prev) =>
        prev.map((airport) =>
          idsToDisapprove.includes(
            airport.id
          )
            ? {
                ...airport,
                is_approved: false,
              }
            : airport
        )
      );

      setSelectedAirportIds([]);

      setMessage(
        data?.message ||
          `${idsToDisapprove.length} airport(s) disapproved successfully.`
      );

    } catch (err) {

      console.error(
        "Bulk Airport Disapprove Error:",
        err
      );

      setError(
        err.message ||
          "Failed to disapprove airports."
      );

    } finally {

      setBulkDisapproveLoading(false);

    }

  };


  const handleDeleteClick = (airport) => {

    setSelectedAirport(airport);

    setShowDeleteModal(true);

  };


  const handleDelete = async () => {

    if (!selectedAirport?.id) {

      return;

    }

    try {

      setDeleteLoading(true);

      setMessage("");

      setError("");

      const response = await fetch(
        AIRPORT_DELETE_API,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            airport_id:
              selectedAirport.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to delete airport."
        );

      }

      setShowDeleteModal(false);

      setSelectedAirport(null);

      setMessage(
        data?.message ||
          "Airport deleted successfully."
      );

      await fetchAirports();

    } catch (err) {

      console.error(
        "Airport Delete Error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete airport."
      );

    } finally {

      setDeleteLoading(false);

    }

  };


  const handleBulkDelete = async () => {

    if (!selectedAirportIds.length) {

      return;

    }

    try {

      setBulkDeleteLoading(true);

      setMessage("");

      setError("");

      const response = await fetch(
        AIRPORT_BULK_DELETE_API,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            airport_ids:
              selectedAirportIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            "Failed to delete airports."
        );

      }

      setSelectedAirportIds([]);

      setMessage(
        data?.message ||
          "Airports deleted successfully."
      );

      await fetchAirports();

    } catch (err) {

      console.error(
        "Bulk Airport Delete Error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete airports."
      );

    } finally {

      setBulkDeleteLoading(false);

    }

  };


  const totalPages = Math.ceil(
    airports.length / recordsPerPage
  );

  const startIndex =
    (currentPage - 1) *
    recordsPerPage;

  const paginatedAirports =
    airports.slice(
      startIndex,
      startIndex + recordsPerPage
    );


  const handlePreviousPage = () => {

    setCurrentPage((prev) =>
      Math.max(prev - 1, 1)
    );

  };

  const handleNextPage = () => {

    setCurrentPage((prev) =>
      Math.min(
        prev + 1,
        totalPages
      )
    );

  };


  return (
    <div className="manufacturer-page aircraft-page">

      <div className="manufacturer-header-banner">

        <h1>Airport Management</h1>

      </div>

      {message && (

        <div className="success-message">

          <CheckCircle2 size={18} />

          <span>{message}</span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
          >
            <X size={16} />
          </button>

        </div>

      )}

      {error && (

        <div className="error-message">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={16} />
          </button>

        </div>

      )}

      <div className="upload-card aircraft-upload-card">

        <div className="upload-area aircraft-upload-area">

          <div className="aircraft-file-upload-row">

            <div className="aircraft-file-section">

              <label className="aircraft-form-label">

                Select Airport JSON Files

              </label>

              <div className="file-input-wrapper">

                <input
                  id="airportJsonFiles"
                  type="file"
                  accept=".json,application/json"
                  multiple
                  onChange={
                    handleFileChange
                  }
                />

                <label
                  htmlFor="airportJsonFiles"
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

            <button
              type="button"
              className="upload-button aircraft-upload-button"
              onClick={handleUpload}
              disabled={
                files.length === 0 ||
                uploading
              }
            >

              {uploading ? (
                <>
                  <Loader2
                    size={17}
                    className="loading-icon"
                  />

                  Processing...
                </>
              ) : (
                <>
                  <Upload size={17} />

                  Upload Airport
                </>
              )}

            </button>

          </div>

          {files.length > 0 && (

            <div className="aircraft-files-list">

              <div className="aircraft-files-header">

                <strong>

                  Selected Files (
                  {files.length}
                  )

                </strong>

                <button
                  type="button"
                  onClick={
                    handleClearFiles
                  }
                >

                  Clear All

                </button>

              </div>

              <div className="aircraft-file-items">

                {files.map(
                  (file, index) => (

                    <div
                      className="aircraft-file-item"
                      key={`${file.name}-${index}`}
                    >

                      <div className="aircraft-file-name">

                        <FileJson
                          size={16}
                        />

                        <span
                          title={
                            file.name
                          }
                        >

                          {file.name}

                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFile(
                            index
                          )
                        }
                        title="Remove file"
                      >

                        <X size={15} />

                      </button>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </div>

      <div className="manufacturer-list aircraft-list">

        <div className="list-header">

          <div className="aircraft-list-header">

            <h2>Airport List</h2>

            <div className="aircraft-action-buttons">

              <button
                type="button"
                className={
                  selectedAirportIds.length ===
                    0 ||
                  allSelectedDisapproved
                    ? "disapprove-btn action-btn-disabled"
                    : "disapprove-btn action-btn-active"
                }
                onClick={
                  handleBulkDisapprove
                }
                disabled={
                  selectedAirportIds.length ===
                    0 ||
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
                    <CheckCircle2 size={16} />

                    Disapprove

                    {selectedAirportIds.length
                      ? ` (${selectedAirportIds.length})`
                      : ""}
                  </>
                )}

              </button>

              <button
                type="button"
                className={
                  selectedAirportIds.length ===
                    0 ||
                  allSelectedApproved
                    ? "approve-btn action-btn-disabled"
                    : "approve-btn action-btn-active"
                }
                onClick={
                  handleBulkApprove
                }
                disabled={
                  selectedAirportIds.length ===
                    0 ||
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

                    {selectedAirportIds.length
                      ? ` (${selectedAirportIds.length})`
                      : ""}
                  </>
                )}

              </button>

              <button
                type="button"
                className={
                  selectedAirportIds.length > 0
                    ? "delete-all-btn action-btn-delete"
                    : "delete-all-btn action-btn-delete-disabled"
                }
                onClick={() =>
                  setShowBulkDeleteModal(
                    true
                  )
                }
                disabled={
                  selectedAirportIds.length ===
                    0 ||
                  bulkDeleteLoading ||
                  bulkApproveLoading ||
                  bulkDisapproveLoading
                }
              >

                {bulkDeleteLoading
                  ? "Deleting..."
                  : `Delete${
                      selectedAirportIds.length
                        ? ` (${selectedAirportIds.length})`
                        : ""
                    }`}

              </button>

            </div>

          </div>

          <div className="manufacturer-counts">

            <div className="count-item">

              <span>Total</span>

              <strong>
                {airports.length}
              </strong>

            </div>

          </div>

        </div>

        {loadingAirport ? (

          <div className="empty-state">

            <RefreshAirportLoader />

            <p>
              Loading airports....
            </p>

          </div>

        ) : airports.length === 0 ? (

          <div className="empty-state">

            <Plane size={35} />

            <h3>
              No airports found
            </h3>

          </div>

        ) : (

          <>

            <div className="table-container">

              <table className="manufacturer-table aircraft-table">

                <thead>

                  <tr>

                    <th>

                      <input
                        type="checkbox"
                        checked={
                          airports.length > 0 &&
                          selectedAirportIds.length ===
                            airports.length
                        }
                        onChange={
                          handleSelectAllAirport
                        }
                      />

                    </th>

                    <th>Sno</th>

                    <th>Airport Name</th>

                    <th>IATA Code</th>

                    <th>ICAO Code</th>

                    <th>Country</th>

                    <th>Latitude</th>

                    <th>Longitude</th>

                    <th>Status</th>

                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedAirports.map(
                    (airport, index) => (

                      <tr
                        key={
                          airport.id
                        }
                      >

                        <td>

                          <input
                            type="checkbox"
                            checked={selectedAirportIds.includes(
                              airport.id
                            )}
                            onChange={() =>
                              handleAirportSelect(
                                airport.id
                              )
                            }
                          />

                        </td>

                        <td>

                          {(currentPage - 1) *
                            recordsPerPage +
                            index +
                            1}

                        </td>

                        <td>

                          {airport.name ||
                            "-"}

                        </td>

                        <td>

                          {airport.iata_code ||
                            "-"}

                        </td>

                        <td>

                          {airport.icao ||
                            "-"}

                        </td>

                        <td>

                          {airport.country ||
                            "-"}

                        </td>

                        <td>

                          {airport.latitude_deg ||
                            "-"}

                        </td>

                        <td>

                          {airport.longitude_deg ||
                            "-"}

                        </td>

                        <td>

                          <span
                            className={
                              airport.is_approved
                                ? "status-active"
                                : "status-inactive"
                            }
                          >

                            {airport.is_approved
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="action-delete-button"
                            onClick={() =>
                              handleDeleteClick(
                                airport
                              )
                            }
                            title="Delete Airport"
                          >

                            <Trash2
                              size={17}
                            />

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="pagination">

              <button
                type="button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  currentPage === 1
                }
              >

                Previous

              </button>

              <span>

                Page {currentPage} of{" "}
                {totalPages || 1}

              </span>

              <button
                type="button"
                onClick={
                  handleNextPage
                }
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

      {showDeleteModal &&
        selectedAirport && (

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
                Delete Airport?
              </h2>

              <p>

                Are you sure you want to delete{" "}

                <strong>

                  {selectedAirport.name ||
                    "this airport"}

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
                  onClick={
                    handleDelete
                  }
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
              Delete Airport?
            </h2>

            <p>

              Are you sure you want to delete{" "}

              <strong>

                {selectedAirportIds.length} selected airports

              </strong>

              ?

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


const RefreshAirportLoader = () => {

  return (
    <Loader2
      size={30}
      className="loading-icon"
    />
  );

};

export default AirportManagement;

