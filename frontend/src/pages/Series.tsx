import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import EditSeriesModal from "../components/Modals/EditSeriesModal";
import DeleteSeriesModal from "../components/Modals/DeleteSeriesModal";

interface SeriesItem {
  id: string;
  name: string;
  chapters: number;
  created_at: string;
  updated_at: string;
}

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

      // Mock data for now - replace with actual API call later
      const mockSeries: SeriesItem[] = [
        {
          id: "1",
          name: "Solo Leveling",
          chapters: 2,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "2",
          name: "The Beginning After The End",
          chapters: 1,
          created_at: "2024-01-16T10:00:00Z",
          updated_at: "2024-01-16T10:00:00Z",
        },
      ];

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Series</h1>
          <button
            onClick={handleAddSeries}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <FiPlus className="text-sm" />
            Add Series
          </button>
        </div>

        {/* Loading State */}
        <div className="bg-white">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading series...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Series</h1>
          <button
            onClick={handleAddSeries}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <FiPlus className="text-sm" />
            Add Series
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchSeries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Series</h1>
        <button
          onClick={handleAddSeries}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <FiPlus className="text-sm" />
          Add Series
        </button>
      </div>

      {/* Series Table */}
      <div className="bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Series Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Chapters
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((seriesItem) => (
              <tr
                key={seriesItem.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSeriesClick(seriesItem.id)}
              >
                <td className="px-6 py-4">
                  <Link
                    to={`/series/${seriesItem.id}/chapters`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {seriesItem.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">
                    {seriesItem.chapters}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditSeries(seriesItem.id);
                      }}
                      className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit series"
                    >
                      <BiSolidEdit className="text-lg" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteSeries(seriesItem.id);
                      }}
                      className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete series"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {series.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-2">📚</div>
            <p className="text-gray-600">No series found</p>
          </div>
        )}
      </div>

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
