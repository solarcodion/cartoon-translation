import { Skeleton } from "./Skeleton";

// Series Page Skeleton - only skeleton for dynamic data
export function SeriesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Page Header - static elements */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Series</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="text-sm">+</span>
          Add Series
        </button>
      </div>

      {/* Series Table - static headers, skeleton for data */}
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
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-32 rounded" />{" "}
                  {/* Series name data */}
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20 rounded" />{" "}
                  {/* Chapter count data */}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Chapters Page Skeleton - only skeleton for dynamic data
export function ChaptersPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back Button - static */}
      <button className="text-blue-600 hover:text-blue-800">
        ← Back to Series
      </button>

      {/* Page Header - static title, skeleton for series name */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Series: <Skeleton className="inline-block h-8 w-48 rounded" />
        </h1>
        <p className="text-gray-600">
          Manage chapters, translation memory, and AI-generated glossary for
          this series.
        </p>
      </div>

      {/* Navigation Tabs - static */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
            Chapters
          </button>
          <button className="py-2 px-1 text-gray-500 hover:text-gray-700">
            Translation Memory
          </button>
          <button className="py-2 px-1 text-gray-500 hover:text-gray-700">
            AI Glossary
          </button>
        </div>
      </div>

      {/* Chapters Table - static headers, skeleton for data */}
      <div className="overflow-hidden mx-6 mb-6 mt-2 border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Chapter No.
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20 rounded" />{" "}
                  {/* Chapter number data */}
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-16 rounded-full" />{" "}
                  {/* Status badge data */}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pages Page Skeleton - only skeleton for dynamic data
export function PagesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back Button - static */}
      <button className="text-blue-600 hover:text-blue-800">
        ← Back to Chapters
      </button>

      {/* Page Header - static title, skeleton for chapter name */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Chapter: <Skeleton className="inline-block h-8 w-48 rounded" />
        </h1>
        <p className="text-gray-600">Manage all aspects of this chapter.</p>
      </div>

      {/* Navigation Tabs - static */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium">
            Pages
          </button>
          <button className="py-2 px-1 text-gray-500 hover:text-gray-700">
            Translations
          </button>
          <button className="py-2 px-1 text-gray-500 hover:text-gray-700">
            Context
          </button>
        </div>
      </div>

      {/* Pages Table - static headers, skeleton for data */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {/* Header with Upload Button - static */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <span>+</span>
              Upload Pages
            </button>
          </div>

          {/* Pages Table - static headers, skeleton for data */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Page
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Dimensions
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-8 rounded" />{" "}
                    {/* Page number data */}
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="w-20 h-20 rounded" />{" "}
                    {/* Image thumbnail data */}
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-16 rounded" />{" "}
                    {/* Dimensions data */}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                      <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Users Page Skeleton - only skeleton for dynamic data
export function UsersPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Page Header - static */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <span>+</span>
          Add User
        </button>
      </div>

      {/* Users Table - static headers, skeleton for data */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Role
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                Created
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24 rounded" />{" "}
                  {/* User name data */}
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-32 rounded" /> {/* Email data */}
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-16 rounded-full" />{" "}
                  {/* Role badge data */}
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20 rounded" />{" "}
                  {/* Created date data */}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                    <button className="h-8 w-8 rounded-lg bg-gray-100"></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Generic List Skeleton - only skeleton for dynamic data
export function ListPageSkeleton({
  showAddButton = true,
  itemCount = 6,
}: {
  showAddButton?: boolean;
  itemCount?: number;
}) {
  return (
    <div className="space-y-8">
      {/* Page Header - static */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
        {showAddButton && (
          <button className="h-10 px-4 bg-gray-100 rounded-lg">Add Item</button>
        )}
      </div>

      {/* Content - skeleton for data */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3 rounded" />{" "}
                  {/* Item title data */}
                  <Skeleton className="h-4 w-1/2 rounded" />{" "}
                  {/* Item subtitle data */}
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />{" "}
                  {/* Status badge data */}
                  <button className="h-8 w-8 rounded bg-gray-100"></button>{" "}
                  {/* Action button */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
