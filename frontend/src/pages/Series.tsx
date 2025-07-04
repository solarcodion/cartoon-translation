import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import AddSeriesModal from "../components/Modals/AddSeriesModal";
import EditSeriesModal from "../components/Modals/EditSeriesModal";
import DeleteSeriesModal from "../components/Modals/DeleteSeriesModal";
import { ErrorState } from "../components/common";
import { SeriesTable } from "../components/Lists";
import { SimplePageHeader } from "../components/Header/PageHeader";
import type { SeriesItem } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useDashboardSync } from "../hooks/useDashboardSync";
import {
  useSeriesData,
  useSeriesLoading,
  useSeriesError,
  useSeriesActions,
} from "../stores";

export default function Series() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { syncAfterSeriesCreate, syncAfterSeriesDelete } = useDashboardSync();

  // Use series store instead of local state
  const series = useSeriesData();
  const isLoading = useSeriesLoading();
  const error = useSeriesError();
  const { fetchSeries, createSeries, updateSeries, deleteSeries, clearError } =
    useSeriesActions();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingSeries, setDeletingSeries] = useState<SeriesItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Check if user can perform admin/editor actions
  const canModify = user?.role === "admin" || user?.role === "editor";

  // Fetch series data on component mount
  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleAddSeries = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleConfirmAddSeries = async (
    seriesName: string,
    language?: string
  ) => {
    try {
      // Create series via store action
      await createSeries({
        title: seriesName,
        language: language || "korean",
      });

      // Update dashboard stats in real-time
      syncAfterSeriesCreate(seriesName);
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

  const handleSaveSeriesName = async (
    seriesId: string,
    newName: string,
    language?: string
  ) => {
    try {
      // Update series via store action
      await updateSeries(seriesId, {
        title: newName,
        language: language,
      });
    } catch (error) {
      console.error("Error updating series name:", error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleConfirmDelete = async (seriesId: string) => {
    try {
      // Get series name before deletion for dashboard update
      const seriesToDelete = series.find((s) => s.id === seriesId);
      const seriesName = seriesToDelete?.name || "Unknown Series";

      // Delete series via store action
      await deleteSeries(seriesId);

      // Update dashboard stats in real-time
      syncAfterSeriesDelete(seriesName);
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
        <ErrorState
          error={error}
          onRetry={() => {
            clearError();
            fetchSeries();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SimplePageHeader
        title="Series"
        action={
          canModify ? (
            <button
              onClick={handleAddSeries}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FiPlus className="text-sm" />
              Add Series
            </button>
          ) : null
        }
      />

      {/* Series Table */}
      <SeriesTable
        series={series}
        onSeriesClick={handleSeriesClick}
        onEditSeries={canModify ? handleEditSeries : undefined}
        onDeleteSeries={canModify ? handleDeleteSeries : undefined}
        canModify={canModify}
        isLoading={isLoading}
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
