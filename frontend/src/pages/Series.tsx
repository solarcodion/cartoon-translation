import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import EditSeriesModal from "../components/Modals/EditSeriesModal";
import DeleteSeriesModal from "../components/Modals/DeleteSeriesModal";
import { SectionLoadingSpinner, ErrorState } from "../components/common";
import { SeriesTable } from "../components/Lists";
import { SimplePageHeader } from "../components/Header/PageHeader";
import type { SeriesItem } from "../types";
import { mockSeries } from "../data/mockData";

export default function Series() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSeries, setDeletingSeries] = useState<SeriesItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch series data
  const fetchSeries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading
      setTimeout(() => {
        setSeries(mockSeries);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error("Unexpected error fetching series:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleAddSeries = () => {
    // TODO: Implement add series functionality
    console.log("Add series clicked");
  };

  const handleEditSeries = (seriesId: string) => {
    const seriesItem = series.find((s) => s.id === seriesId);
    if (seriesItem) {
      setEditingSeries(seriesItem);
      setIsModalOpen(true);
    }
  };

  const handleDeleteSeries = (seriesId: string) => {
    const seriesItem = series.find((s) => s.id === seriesId);
    if (seriesItem) {
      setDeletingSeries(seriesItem);
      setIsDeleteModalOpen(true);
    }
  };

  const handleSaveSeriesName = async (seriesId: string, newName: string) => {
    try {
      // TODO: Replace with actual API call
      console.log("Updating series:", seriesId, "to:", newName);

      // Update the series in the local state
      setSeries((prevSeries) =>
        prevSeries.map((seriesItem) =>
          seriesItem.id === seriesId
            ? {
                ...seriesItem,
                name: newName,
                updated_at: new Date().toISOString(),
              }
            : seriesItem
        )
      );

      console.log("Series name updated successfully");
      // TODO: Show success toast/notification
    } catch (error) {
      console.error("Unexpected error updating series name:", error);
      // TODO: Show error toast/notification
    }
  };

  const handleConfirmDelete = async (seriesId: string) => {
    try {
      // TODO: Replace with actual API call
      console.log("Deleting series:", seriesId);

      // Remove the series from the local state
      setSeries((prevSeries) =>
        prevSeries.filter((seriesItem) => seriesItem.id !== seriesId)
      );

      console.log("Series deleted successfully");
      // TODO: Show success toast/notification
    } catch (error) {
      console.error("Unexpected error deleting series:", error);
      // TODO: Show error toast/notification
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeries(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSeries(null);
  };

  const handleSeriesClick = (seriesId: string) => {
    navigate(`/series/${seriesId}/chapters`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <SimplePageHeader
          title="Series"
          action={
            <button
              onClick={handleAddSeries}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiPlus className="text-sm" />
              Add Series
            </button>
          }
        />

        {/* Loading State */}
        <div className="bg-white">
          <SectionLoadingSpinner text="Loading series..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <SimplePageHeader
          title="Series"
          action={
            <button
              onClick={handleAddSeries}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiPlus className="text-sm" />
              Add Series
            </button>
          }
        />
        <ErrorState error={error} onRetry={fetchSeries} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SimplePageHeader
        title="Series"
        action={
          <button
            onClick={handleAddSeries}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <FiPlus className="text-sm" />
            Add Series
          </button>
        }
      />

      {/* Series Table */}
      <SeriesTable
        series={series}
        onSeriesClick={handleSeriesClick}
        onEditSeries={handleEditSeries}
        onDeleteSeries={handleDeleteSeries}
      />

      {/* Edit Series Modal */}
      <EditSeriesModal
        series={editingSeries}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSeriesName}
      />

      {/* Delete Series Modal */}
      <DeleteSeriesModal
        series={deletingSeries}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}
