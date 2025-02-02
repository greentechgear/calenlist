import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarType } from '../types/calendar';
import { bannerPresets } from '../lib/banner/presets';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from '../utils/toast';
import DeleteCalendarModal from '../components/modals/DeleteCalendarModal';
import CalendarLinksSection from '../components/settings/CalendarLinksSection';
import BasicSettingsForm from '../components/settings/BasicSettingsForm';
import InviteSection from '../components/settings/InviteSection';
import { validateCalendarForm } from '../utils/calendarValidation';
import SEO from '../components/SEO';

type AddressVisibility = 'public' | 'subscribers' | 'private';

export default function CalendarSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<CalendarType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [addressVisibility, setAddressVisibility] = useState<AddressVisibility>('subscribers');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCalendar();
    }
  }, [id]);

  const fetchCalendar = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('calendars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setCalendar(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setGoogleCalendarUrl(data.google_calendar_url || '');
      setSelectedBanner(data.banner?.id || bannerPresets[0].id);
      setCategoryId(data.category_id || '');
      setDemoVideoUrl(data.demo_video_url || '');
      setIsPublic(data.is_public);
      setPhysicalAddress(data.physical_address || '');
      setAddressVisibility(data.address_visibility || 'subscribers');
    } catch (error) {
      console.error('Error fetching calendar:', error);
      toast.error('Failed to load calendar settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendar || !user?.id) return;

    const errors = validateCalendarForm({
      name,
      description,
      googleCalendarUrl,
      categoryId,
      demoVideoUrl
    });

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const banner = bannerPresets.find(b => b.id === selectedBanner);
      if (!banner) throw new Error('Invalid banner selected');

      const { error } = await supabase
        .from('calendars')
        .update({
          banner,
          name: name.trim(),
          description: description.trim() || null,
          google_calendar_url: googleCalendarUrl.trim(),
          category_id: categoryId,
          demo_video_url: demoVideoUrl.trim() || null,
          is_public: isPublic,
          physical_address: physicalAddress.trim() || null,
          address_visibility: addressVisibility
        })
        .eq('id', calendar.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Settings saved successfully');
      navigate(`/calendar/${calendar.id}`);
    } catch (error) {
      console.error('Error updating calendar:', error);
      toast.error('Failed to save settings');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!calendar || !user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('calendars')
        .delete()
        .eq('id', calendar.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Calendar deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting calendar:', error);
      toast.error('Failed to delete calendar');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!calendar || (user?.id !== calendar.user_id)) {
    return <div className="flex items-center justify-center min-h-screen">Not authorized</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Calendar Settings" 
        description="Manage your calendar settings and preferences"
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate(`/calendar/${calendar.id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Calendar
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Calendar
          </button>
        </div>

        <div className="space-y-6">
          <BasicSettingsForm
            name={name}
            description={description}
            googleCalendarUrl={googleCalendarUrl}
            categoryId={categoryId}
            selectedBanner={selectedBanner}
            demoVideoUrl={demoVideoUrl}
            isPublic={isPublic}
            physicalAddress={physicalAddress}
            addressVisibility={addressVisibility}
            validationErrors={validationErrors}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onGoogleCalendarUrlChange={setGoogleCalendarUrl}
            onCategoryChange={setCategoryId}
            onBannerChange={setSelectedBanner}
            onDemoVideoUrlChange={setDemoVideoUrl}
            onIsPublicChange={setIsPublic}
            onPhysicalAddressChange={setPhysicalAddress}
            onAddressVisibilityChange={setAddressVisibility}
            onSubmit={handleSubmit}
            saving={saving}
          />

          <InviteSection calendar={calendar} />

          {calendar && user && (
            <CalendarLinksSection
              calendarId={calendar.id}
              userId={user.id}
              initialLinks={{
                Twitch: calendar.streaming_urls?.Twitch,
                YouTube: calendar.streaming_urls?.YouTube,
                customUrl: calendar.custom_url
              }}
              onUpdate={fetchCalendar}
            />
          )}
        </div>
      </div>

      <DeleteCalendarModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        calendarName={name}
        isDeleting={isDeleting}
      />
    </div>
  );
}