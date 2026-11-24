import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('urbangreen_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getCsrfCookie() {
  await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true });
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
}

export async function loginRequest(email: string, password: string) {
  await getCsrfCookie();
  const response = await api.post('/login', { email, password });
  return response.data;
}

export async function registerRequest(name: string, email: string, password: string, password_confirmation: string, role?: string) {
  await getCsrfCookie();
  const response = await api.post('/register', { name, email, password, password_confirmation, role });
  return response.data;
}
export async function logoutRequest() {
  const response = await api.post('/logout');
  return response.data;
}

export async function meRequest() {
  const response = await api.get('/me');
  return response.data;
}

export interface Zone {
  id: number;
  name: string;
  description: string | null;
  status: string;
  plants_count?: number;
  sensors_count?: number;
  devices_count?: number;
}

export interface Plant {
  id: number;
  name: string;
  species: string | null;
  zone_id: number;
  zone?: Zone;
  status: string;
  moisture: string | null;
  planted_date: string | null;
  last_watered_at: string | null;
}

export interface Sensor {
  id: number;
  name: string;
  type: string;
  zone_id: number;
  zone?: Zone;
  status: string;
  battery_level: number;
  current_value: string | null;
  unit: string | null;
  last_seen_at: string | null;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  zone_id: number;
  zone?: Zone;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  last_seen_at: string | null;
}

export async function getZones() {
  const response = await api.get('/zones');
  return response.data;
}

export async function getPlants() {
  const response = await api.get('/plants');
  return response.data;
}

export async function getSensors() {
  const response = await api.get('/sensors');
  return response.data;
}

export async function getDevices() {
  const response = await api.get('/devices');
  return response.data;
}

export async function toggleDevice(deviceId: number) {
  const response = await api.post(`/devices/${deviceId}/toggle`);
  return response.data;
}

export async function waterPlant(plantId: number) {
  const response = await api.put(`/plants/${plantId}`, {
    moisture: 85,
    status: 'healthy',
    last_watered_at: new Date().toISOString(),
  });
  return response.data;
}

export async function updateDeviceSettings(deviceId: number, settings: Record<string, unknown>) {
  const response = await api.put(`/devices/${deviceId}`, { settings });
  return response.data;
}

export async function createZone(data: { name: string; description?: string; status?: string }) {
  const response = await api.post('/zones', data);
  return response.data;
}

export async function updateZone(id: number, data: { name?: string; description?: string; status?: string }) {
  const response = await api.put(`/zones/${id}`, data);
  return response.data;
}

export async function deleteZone(id: number) {
  const response = await api.delete(`/zones/${id}`);
  return response.data;
}

export async function createPlant(data: { name: string; species?: string; zone_id: number; status?: string; moisture?: number }) {
  const response = await api.post('/plants', data);
  return response.data;
}

export async function updatePlant(id: number, data: { name?: string; species?: string; zone_id?: number; status?: string; moisture?: number }) {
  const response = await api.put(`/plants/${id}`, data);
  return response.data;
}

export async function deletePlant(id: number) {
  const response = await api.delete(`/plants/${id}`);
  return response.data;
}

export async function createSensor(data: { name: string; type: string; zone_id: number; unit?: string }) {
  const response = await api.post('/sensors', data);
  return response.data;
}

export async function updateSensor(id: number, data: { name?: string; type?: string; zone_id?: number; status?: string; unit?: string }) {
  const response = await api.put(`/sensors/${id}`, data);
  return response.data;
}

export async function deleteSensor(id: number) {
  const response = await api.delete(`/sensors/${id}`);
  return response.data;
}

export async function createDevice(data: { name: string; type: string; zone_id: number }) {
  const response = await api.post('/devices', data);
  return response.data;
}

export async function updateDevice(id: number, data: { name?: string; type?: string; zone_id?: number }) {
  const response = await api.put(`/devices/${id}`, data);
  return response.data;
}

export async function deleteDevice(id: number) {
  const response = await api.delete(`/devices/${id}`);
  return response.data;
}

export async function updateUserPassword(currentPassword: string, newPassword: string) {
  const response = await api.put('/user/password', {
    current_password: currentPassword,
    new_password: newPassword,
    new_password_confirmation: newPassword,
  });
  return response.data;
}

export interface ReportLog {
  id: number;
  user_id: number;
  type: string;
  format: string;
  file_path: string;
  generated_at: string;
}

export async function getReportHistory() {
  const response = await api.get('/reports');
  return response.data;
}

export async function generateReport(type: string, name?: string) {
  const response = await api.post('/reports/generate', { type, name });
  return response.data;
}

export function getReportDownloadUrl(reportLogId: number) {
  return `http://localhost:8000/api/reports/${reportLogId}/download`;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
}

export async function listUsers() {
  const response = await api.get('/users');
  return response.data;
}

export async function createUser(data: { name: string; email: string; password: string; password_confirmation: string; role: string }) {
  const response = await api.post('/users', data);
  return response.data;
}

export async function updateUserRole(userId: number, role: string) {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data;
}

export async function recoverAdmin(email: string, password: string, recoveryCode: string) {
  const response = await api.post('/recover-admin', {
    email,
    password,
    recovery_code: recoveryCode,
  });
  return response.data;
}

export async function deleteUser(userId: number) {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  low_battery_alerts: boolean;
  critical_sensor_warnings: boolean;
  daily_reports: boolean;
  timezone: string;
  temperature_unit: string;
  refresh_rate: string;
}

export async function updateProfile(name: string, email: string, phone?: string) {
  const response = await api.put('/user/profile', { name, email, phone });
  return response.data;
}

export async function getPreferences() {
  const response = await api.get('/user/preferences');
  return response.data;
}

export async function updatePreferences(data: Partial<UserPreferences>) {
  const response = await api.put('/user/preferences', data);
  return response.data;
}

export interface LoginHistoryEntry {
  id: number;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export async function getLoginHistory() {
  const response = await api.get('/user/login-history');
  return response.data;
}

export interface SensorReadingPoint {
  value: string;
  recorded_at: string;
}

export async function getTemperatureHistory() {
  const response = await api.get('/sensors/readings-history?type=temperature&hours=24');
  return response.data;
}

export async function getWaterPumpActivity() {
  const response = await api.get('/devices/water-pump-activity');
  return response.data;
}

export async function toggleSensorStatus(sensorId: number) {
  const response = await api.post(`/sensors/${sensorId}/toggle-status`);
  return response.data;
}

export async function getSensorReadingsById(sensorId: number) {
  const response = await api.get(`/sensors/readings-history?sensor_id=${sensorId}&hours=24`);
  return response.data;
}

export async function getDeviceActivityById(deviceId: number) {
  const response = await api.get(`/devices/activity?device_id=${deviceId}`);
  return response.data;
}


export interface CareTask {
  id: number;
  title: string;
  type: string;
  notes: string | null;
  plant_id: number | null;
  plant: string | null;
  zone_id: number | null;
  zone: string | null;
  assigned_to: number | null;
  assignee: string | null;
  due_date: string;
  repeat_days: number | null;
  status: 'pending' | 'completed';
  is_overdue: boolean;
  completed_at: string | null;
}

export interface CareTaskInput {
  title: string;
  type: string;
  notes?: string;
  plant_id?: number | null;
  zone_id?: number | null;
  assigned_to?: number | null;
  due_date: string;
  repeat_days?: number | null;
}

export async function getCareTasks() {
  const response = await api.get('/care-tasks');
  return response.data;
}

export async function createCareTask(data: CareTaskInput) {
  const response = await api.post('/care-tasks', data);
  return response.data;
}

export async function updateCareTask(id: number, data: CareTaskInput) {
  const response = await api.put(`/care-tasks/${id}`, data);
  return response.data;
}

export async function deleteCareTask(id: number) {
  const response = await api.delete(`/care-tasks/${id}`);
  return response.data;
}

export async function completeCareTask(id: number) {
  const response = await api.post(`/care-tasks/${id}/complete`);
  return response.data;
}

export interface AppAlert {
  id: number;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  related_type: string | null;
  related_id: number | null;
  created_at: string;
}

export async function getAlerts() {
  const response = await api.get('/alerts');
  return response.data;
}

export async function markAlertRead(id: number) {
  const response = await api.post(`/alerts/${id}/read`);
  return response.data;
}

export async function markAllAlertsRead() {
  const response = await api.post('/alerts/read-all');
  return response.data;
}

export interface JournalEntry {
  id: number;
  plant_id: number;
  user_id: number | null;
  author: string | null;
  entry_date: string;
  growth_stage: string | null;
  height_cm: number | null;
  notes: string | null;
  is_harvest: boolean;
  harvest_amount: number | null;
  harvest_unit: string | null;
}

export interface JournalEntryInput {
  entry_date: string;
  growth_stage?: string | null;
  height_cm?: number | null;
  notes?: string | null;
  is_harvest?: boolean;
  harvest_amount?: number | null;
  harvest_unit?: string | null;
}

export async function getJournal(plantId: number) {
  const response = await api.get(`/plants/${plantId}/journal`);
  return response.data;
}

export async function createJournalEntry(plantId: number, data: JournalEntryInput) {
  const response = await api.post(`/plants/${plantId}/journal`, data);
  return response.data;
}

export async function updateJournalEntry(id: number, data: JournalEntryInput) {
  const response = await api.put(`/journal-entries/${id}`, data);
  return response.data;
}

export async function deleteJournalEntry(id: number) {
  const response = await api.delete(`/journal-entries/${id}`);
  return response.data;
}

export interface PlantSpecies {
  id: number;
  name: string;
  scientific_name: string | null;
  temp_min: number | null;
  temp_max: number | null;
  humidity_min: number | null;
  humidity_max: number | null;
  soil_moisture_min: number | null;
  soil_moisture_max: number | null;
  ph_min: number | null;
  ph_max: number | null;
  water_every_days: number | null;
  care_notes: string | null;
}

export type PlantSpeciesInput = Omit<PlantSpecies, 'id'>;

export async function getPlantSpecies() {
  const response = await api.get('/plant-species');
  return response.data;
}

export async function createPlantSpecies(data: Partial<PlantSpeciesInput>) {
  const response = await api.post('/plant-species', data);
  return response.data;
}

export async function updatePlantSpecies(id: number, data: Partial<PlantSpeciesInput>) {
  const response = await api.put(`/plant-species/${id}`, data);
  return response.data;
}

export async function deletePlantSpecies(id: number) {
  const response = await api.delete(`/plant-species/${id}`);
  return response.data;
}

export interface ZoneReading {
  id: number;
  zone_id: number;
  zone: string | null;
  user_id: number | null;
  author: string | null;
  recorded_at: string;
  temperature: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  ph: number | null;
  notes: string | null;
}

export interface ZoneReadingInput {
  zone_id: number;
  recorded_at?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  soil_moisture?: number | null;
  ph?: number | null;
  notes?: string | null;
}

export async function getZoneReadings(zoneId?: number, days = 7) {
  const params = new URLSearchParams({ days: String(days) });
  if (zoneId) params.set('zone_id', String(zoneId));
  const response = await api.get(`/zone-readings?${params.toString()}`);
  return response.data;
}

export async function createZoneReading(data: ZoneReadingInput) {
  const response = await api.post('/zone-readings', data);
  return response.data;
}

export async function updateZoneReading(id: number, data: ZoneReadingInput) {
  const response = await api.put(`/zone-readings/${id}`, data);
  return response.data;
}

export async function deleteZoneReading(id: number) {
  const response = await api.delete(`/zone-readings/${id}`);
  return response.data;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: 'seed' | 'fertilizer' | 'pesticide' | 'supplies' | 'other';
  quantity: number;
  unit: string;
  low_stock_level: number;
  is_low_stock: boolean;
  notes: string | null;
  updated_at: string | null;
}

export interface InventoryItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  low_stock_level: number;
  notes?: string | null;
}

export async function getInventory() {
  const response = await api.get('/inventory');
  return response.data;
}

export async function createInventoryItem(data: InventoryItemInput) {
  const response = await api.post('/inventory', data);
  return response.data;
}

export async function updateInventoryItem(id: number, data: InventoryItemInput) {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data;
}

export async function deleteInventoryItem(id: number) {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
}

export async function adjustInventoryItem(id: number, change: number) {
  const response = await api.post(`/inventory/${id}/adjust`, { change });
  return response.data;
}

export async function forgotPasswordRequest(email: string) {
  await getCsrfCookie();
  const response = await api.post('/forgot-password', { email });
  return response.data;
}

export async function resetPasswordRequest(token: string, email: string, password: string, password_confirmation: string) {
  await getCsrfCookie();
  const response = await api.post('/reset-password', { token, email, password, password_confirmation });
  return response.data;
}


export async function downloadReportFile(reportLogId: number) {
  const response = await api.get(`/reports/${reportLogId}/download`, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : `report-${reportLogId}.pdf`;
  return { blob: response.data as Blob, filename };
}