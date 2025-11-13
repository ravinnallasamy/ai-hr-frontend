import React from 'react';
import { UserProfile } from '../types';

interface UserCardProps {
  user: UserProfile;
  onSelectUser: (userId: string) => void;
}

const statusColorMap = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const UserCard: React.FC<UserCardProps> = ({ user, onSelectUser }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
         onClick={() => onSelectUser(user.user_id)}>
      <div className="p-5">
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl">
                    {user.full_name.charAt(0)}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColorMap[user.status]}`}>
                {user.status}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
                Joined: {new Date(user.created_at).toLocaleDateString()}
            </span>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
