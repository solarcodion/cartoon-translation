import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import AddSeriesModal from "../components/Modals/AddSeriesModal";
import EditSeriesModal from "../components/Modals/EditSeriesModal";
import DeleteSeriesModal from "../components/Modals/DeleteSeriesModal";
import { SectionLoadingSpinner, ErrorState } from "../components/common";
import { SeriesTable } from "../components/Lists";
import { SimplePageHeader } from "../components/Header/PageHeader";
import type { SeriesItem } from "../types";
import { seriesService } from "../services/seriesService";
import { convertApiSeriesToLegacy } from "../types/series";

export default function Series() {
  const navigate = useNavigate();
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSeries, setDeletingSeries] = useState<SeriesItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch series data
  const fetchSeries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch from API
      const apiSeries = await seriesService.getAllSeries();

      // Convert API response to legacy format for compatibility
      const legacySeries = apiSeries.map(convertApiSeriesToLegacy);
      setSeries(legacySeries);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching series:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleAddSeries = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleConfirmAddSeries = async (seriesName: string) => {
    try {
      // Create series via API
      const newApiSeries = await seriesService.createSeries({
        title: seriesName,
      });

      // Convert to legacy format and add to list
      const newLegacySeries = convertApiSeriesToLegacy(newApiSeries);
      setSeries((prevSeries) => [...prevSeries, newLegacySeries]);
    } catch (error) {
      console.error("Error adding series:", error);
      throw error; // Re-throw to let the modal handle the error
    }
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
      // Update series via API
      const updatedApiSeries = await seriesService.updateSeries(seriesId, {
        title: newName,
      });

      // Update the series in the local state
      setSeries((prevSeries) =>
        prevSeries.map((seriesItem) =>
          seriesItem.id === seriesId
            ? convertApiSeriesToLegacy(updatedApiSeries)
            : seriesItem
        )
      );
    } catch (error) {
      console.error("Error updating series name:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleConfirmDelete = async (seriesId: string) => {
    try {
      // Delete series via API
      await seriesService.deleteSeries(seriesId);

      // Remove the series from the local state
      setSeries((prevSeries) =>
        prevSeries.filter((seriesItem) => seriesItem.id !== seriesId)
      );
    } catch (error) {
      console.error("Error deleting series:", error);
      throw error; // Re-throw to let the modal handle the error
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

      {/* Add Series Modal */}
      <AddSeriesModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleConfirmAddSeries}
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
