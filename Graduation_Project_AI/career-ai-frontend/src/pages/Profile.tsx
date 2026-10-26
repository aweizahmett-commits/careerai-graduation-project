import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Save, 
  X,
  Target
} from 'lucide-react'
import axios from 'axios'

const Profile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mark skill development as started when user visits profile
    localStorage.setItem('skill_development_started', 'true')
    fetchProfile()
  }, [])

  const [profile, setProfile] = useState({
    id: 1,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    joinDate: '',
    lastLogin: '',
    skills: ['JavaScript', 'React', 'Python', 'Node.js', 'SQL'],
    experience: '',
    education: '',
    accountStatus: 'Active'
  })

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/profile/')
      setProfile(response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      // Fallback to static data
      setProfile({
        id: 1,
        firstName: user?.first_name || 'John',
        lastName: user?.last_name || 'Doe',
        email: user?.email || 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        bio: 'Passionate software developer with expertise in full-stack web development and data analysis. Looking for opportunities to leverage my skills in building innovative solutions.',
        joinDate: 'January 2024',
        lastLogin: '2 hours ago',
        skills: ['JavaScript', 'React', 'Python', 'Node.js', 'SQL'],
        experience: '5 years',
        education: 'Bachelor of Science in Computer Science',
        accountStatus: 'Active'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Make actual API call to update profile
      const response = await axios.post('http://localhost:8000/api/profile/', profile)
      console.log('Profile updated successfully:', response.data)
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent p-4 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8 bg-theme-card backdrop-blur-xl border border-theme rounded-2xl p-8 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-theme-primary mb-2">Profile</h1>
            <p className="text-theme-muted">Manage your personal information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary hover:from-theme-accent-primary hover:to-theme-accent-secondary text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isEditing ? (
              <>
                <X className="w-5 h-5 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5 mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-theme-card rounded-2xl border border-theme p-6 lg:p-8"
        >
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <span className="text-3xl font-bold text-white">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-theme-primary mb-2">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-theme-muted">{profile.email}</p>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-theme-secondary mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    id="firstName"
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-theme-secondary mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    id="lastName"
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-theme-secondary mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-theme-secondary mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
                  <input
                    id="location"
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Bio & Stats */}
            <div className="space-y-6">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-theme-secondary mb-2">
                  Professional Bio
                </label>
                <textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={6}
                  className="w-full px-4 py-3 bg-theme-card-hover border border-theme rounded-xl text-theme-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none disabled:cursor-not-allowed"
                />
              </div>

              {/* Account Stats */}
              <div className="bg-theme-card-hover rounded-xl p-6 border border-theme">
                <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-theme-accent-primary" />
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Member Since</span>
                    <span className="text-theme-primary font-medium">{profile.joinDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Last Login</span>
                    <span className="text-theme-primary font-medium">{profile.lastLogin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-muted">Account Status</span>
                    <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                      profile.accountStatus === 'Active' 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {profile.accountStatus || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-8"
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Profile
