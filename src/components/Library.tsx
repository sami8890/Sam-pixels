import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Eye, 
  Filter, 
  Search, 
  Grid, 
  List,
  Calendar,
  Image as ImageIcon,
  Folder,
  Star,
  Share2
} from 'lucide-react';
import { useAuth } from '../utils/auth';
import { useToast } from './Toast';

interface LibraryItem {
  id: string;
  name: string;
  type: 'background-removal' | 'upscaling' | 'watermark' | 'crop-resize';
  originalUrl: string;
  processedUrl: string;
  createdAt: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  settings?: any;
  isFavorite: boolean;
  tags: string[];
}

interface LibraryProps {
  onBackToTools: () => void;
}

const Library: React.FC<LibraryProps> = ({ onBackToTools }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  useEffect(() => {
    loadLibraryItems();
  }, []);

  const loadLibraryItems = async () => {
    try {
      const response = await fetch('/api/library', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      } else {
        showError('Failed to load library', 'Please try again later.');
      }
    } catch (error) {
      showError('Network error', 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items
    .filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleDownload = async (item: LibraryItem) => {
    try {
      const link = document.createElement('a');
      link.href = item.processedUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success('Download started!', `${item.name} is being downloaded.`);
    } catch (error) {
      showError('Download failed', 'Please try again.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/library/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
        success('Item deleted', 'The item has been removed from your library.');
      } else {
        showError('Delete failed', 'Please try again.');
      }
    } catch (error) {
      showError('Network error', 'Failed to delete item.');
    }
  };

  const handleToggleFavorite = async (itemId: string) => {
    try {
      const response = await fetch(`/api/library/${itemId}/favorite`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setItems(items.map(item => 
          item.id === itemId 
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'background-removal': '🎭',
      'upscaling': '🔍',
      'watermark': '🏷️',
      'crop-resize': '✂️',
    };
    return icons[type as keyof typeof icons] || '📷';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'background-removal': 'bg-red-100 text-red-800',
      'upscaling': 'bg-blue-100 text-blue-800',
      'watermark': 'bg-purple-100 text-purple-800',
      'crop-resize': 'bg-teal-100 text-teal-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBackToTools}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Tools
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Folder className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
                <p className="text-gray-600">
                  {items.length} items • {user?.subscription.plan} plan
                </p>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="background-removal">Background Removal</option>
              <option value="upscaling">Image Upscaling</option>
              <option value="watermark">Text Watermark</option>
              <option value="crop-resize">Crop & Resize</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'type')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
            </select>

            {/* Results count */}
            <div className="flex items-center text-sm text-gray-600">
              {filteredItems.length} of {items.length} items
            </div>
          </div>
        </div>

        {/* Library Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start processing images to build your library'
              }
            </p>
            <button
              onClick={onBackToTools}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200"
            >
              Process Images
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    <div className="relative aspect-video bg-gray-50">
                      <img
                        src={item.processedUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)} {item.type.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => handleToggleFavorite(item.id)}
                          className={`p-1.5 rounded-full transition-colors ${
                            item.isFavorite 
                              ? 'bg-yellow-100 text-yellow-600' 
                              : 'bg-white/80 text-gray-400 hover:text-yellow-600'
                          }`}
                        >
                          <Star className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.name}</h3>
                      <div className="text-xs text-gray-500 mb-3">
                        <div>{item.dimensions.width} × {item.dimensions.height}px</div>
                        <div>{formatFileSize(item.fileSize)}</div>
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.processedUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </span>
                        {item.isFavorite && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.dimensions.width} × {item.dimensions.height}px • {formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isFavorite 
                            ? 'text-yellow-600 bg-yellow-50' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;