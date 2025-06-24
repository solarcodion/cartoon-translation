// Reusable User Table Component with Desktop and Mobile Views

import type { DatabaseUser } from "../../types/database";
import { UserTableRow, UserListItem } from "./Items";
import { NoUsersFound } from "../common";

interface UserTableProps {
  /** Array of users to display */
  users: DatabaseUser[];
  /** Callback when edit button is clicked */
  onEditUser: (userId: string) => void;
  /** Callback when delete button is clicked */
  onDeleteUser: (userId: string) => void;
  /** Function to get role badge color classes */
  getRoleBadgeColor: (role: string) => string;
}

export default function UserTable({
  users,
  onEditUser,
  onDeleteUser,
  getRoleBadgeColor,
}: UserTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onEdit={() => onEditUser(user.id)}
                  onDelete={() => onDeleteUser(user.id)}
                  getRoleBadgeColor={getRoleBadgeColor}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state - Desktop */}
        {users.length === 0 && <NoUsersFound />}
      </div>

      {/* Mobile List */}
      <div className="md:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
          {users.map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              onEdit={() => onEditUser(user.id)}
              onDelete={() => onDeleteUser(user.id)}
              getRoleBadgeColor={getRoleBadgeColor}
            />
          ))}
        </div>

        {/* Empty state - Mobile */}
        {users.length === 0 && (
          <NoUsersFound className="bg-white rounded-lg shadow-sm border border-gray-200 p-8" />
        )}
      </div>
    </>
  );
}
