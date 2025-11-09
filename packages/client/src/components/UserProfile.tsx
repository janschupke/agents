import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ApiCredentialsService } from '../services/api-credentials.service';
import PageContainer from './PageContainer';
import PageHeader from './PageHeader';
import { IconClose } from './Icons';
import { useApiKeyStatus, useUserInfo } from '../contexts/AppContext';

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser();
  const { hasApiKey: cachedHasApiKey, loadingApiKey, refreshApiKey } = useApiKeyStatus();
  const { userInfo: cachedUserInfo, loadingUser } = useUserInfo();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Use cached API key status
  const hasApiKey = cachedHasApiKey ?? false;
  const apiKeyLoading = loadingApiKey;
  
  // Use cached user info
  const userInfo = cachedUserInfo;
  // Only show loading if we don't have user info yet and it's actually loading
  // If user info is cached, don't show loading state
  const loading = loadingUser && !cachedUserInfo;

  useEffect(() => {
    // User info and API key status are loaded from cache in AppContext
    // Just update UI state based on cached values
    if (hasApiKey) {
      setApiKey('••••••••••••••••••••••••••••••••');
      setShowApiKeyInput(false);
    } else {
      setShowApiKeyInput(true);
    }
  }, [hasApiKey]);


  // Update UI when cached API key status changes
  useEffect(() => {
    if (hasApiKey) {
      setApiKey('••••••••••••••••••••••••••••••••');
      setShowApiKeyInput(false);
    } else {
      setShowApiKeyInput(true);
    }
  }, [hasApiKey]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError('API key cannot be empty');
      return;
    }

    setApiKeySaving(true);
    setApiKeyError(null);
    try {
      await ApiCredentialsService.setOpenAIKey(apiKey);
      // Refresh cached API key status
      await refreshApiKey();
      setApiKey('••••••••••••••••••••••••••••••••');
      setShowApiKeyInput(false);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('apiKeySaved'));
    } catch (error: unknown) {
      const err = error as { message?: string };
      setApiKeyError(err.message || 'Failed to save API key');
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to delete your API key? You will need to set it again to use the chat.')) {
      return;
    }

    setApiKeySaving(true);
    setApiKeyError(null);
    try {
      await ApiCredentialsService.deleteOpenAIKey();
      // Refresh cached API key status
      await refreshApiKey();
      setApiKey('');
      setShowApiKeyInput(true);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('apiKeySaved'));
    } catch (error: unknown) {
      const err = error as { message?: string };
      setApiKeyError(err.message || 'Failed to delete API key');
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleApiKeyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setApiKeyError(null);
  };

  const handleEditApiKey = () => {
    setShowApiKeyInput(true);
    setApiKey('');
  };

  const handleClose = () => {
    navigate('/chat');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-full">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  const displayUser = userInfo || {
    id: clerkUser?.id || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || null,
    firstName: clerkUser?.firstName || null,
    lastName: clerkUser?.lastName || null,
    imageUrl: clerkUser?.imageUrl || null,
    roles: [],
  };

  return (
    <PageContainer>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="User Profile"
          actions={
            <button
              onClick={handleClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close"
            >
              <IconClose className="w-6 h-6" />
            </button>
          }
        />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          {displayUser.imageUrl ? (
            <img
              src={displayUser.imageUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-text-inverse text-3xl font-semibold border-4 border-border">
              {(displayUser.firstName || displayUser.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-text-primary">
              {displayUser.firstName || displayUser.lastName
                ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim()
                : 'User'}
            </h3>
            {displayUser.email && (
              <p className="text-text-secondary mt-1">{displayUser.email}</p>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-text-secondary">User ID</label>
            <p className="mt-1 text-text-primary font-mono text-sm break-all">
              {displayUser.id}
            </p>
          </div>

          {displayUser.firstName && (
            <div>
              <label className="text-sm font-medium text-text-secondary">First Name</label>
              <p className="mt-1 text-text-primary">{displayUser.firstName}</p>
            </div>
          )}

          {displayUser.lastName && (
            <div>
              <label className="text-sm font-medium text-text-secondary">Last Name</label>
              <p className="mt-1 text-text-primary">{displayUser.lastName}</p>
            </div>
          )}

          {displayUser.email && (
            <div>
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <p className="mt-1 text-text-primary">{displayUser.email}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-text-secondary">Roles</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {displayUser.roles && displayUser.roles.length > 0 ? (
                displayUser.roles.map((role, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary text-text-inverse text-xs font-medium rounded-full"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-text-secondary text-sm">No roles assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="pt-4 border-t border-border">
          <div className="mb-4">
            <label className="text-sm font-medium text-text-secondary block mb-2">
              OpenAI API Key {!hasApiKey && <span className="text-red-600">*</span>}
            </label>
            {!hasApiKey && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Required:</strong> You must set your OpenAI API key to use the chat feature. 
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-900"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>
            )}
            <p className="text-xs text-text-tertiary mb-3">
              Your API key is encrypted and stored securely. It will never be sent back to the frontend in plaintext.
            </p>
            {apiKeyLoading ? (
              <div className="text-text-secondary text-sm">Loading...</div>
            ) : (
              <div className="space-y-3">
                {!showApiKeyInput && hasApiKey && apiKey ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="password"
                      value={apiKey}
                      disabled
                      className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary font-mono"
                      placeholder="API key is set"
                    />
                    <button
                      onClick={handleEditApiKey}
                      className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteApiKey}
                      disabled={apiKeySaving}
                      className="h-8 px-4 bg-red-600 text-white border-none rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-disabled disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={handleApiKeyInputChange}
                      placeholder="Enter your OpenAI API key"
                      disabled={apiKeySaving}
                      className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background-secondary focus:outline-none focus:border-border-focus disabled:bg-disabled-bg disabled:cursor-not-allowed font-mono"
                    />
                    {apiKeyError && (
                      <p className="text-xs text-red-600">{apiKeyError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveApiKey}
                        disabled={apiKeySaving || !apiKey.trim()}
                        className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
                      >
                        {apiKeySaving ? 'Saving...' : 'Save'}
                      </button>
                      {hasApiKey && (
                        <button
                          onClick={() => {
                            setShowApiKeyInput(false);
                            setApiKey('••••••••••••••••••••••••••••••••');
                            setApiKeyError(null);
                          }}
                          disabled={apiKeySaving}
                          className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors disabled:bg-disabled disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={handleClose}
            className="h-8 px-4 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors"
          >
            Close
          </button>
        </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
