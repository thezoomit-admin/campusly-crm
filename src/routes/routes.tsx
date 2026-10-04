import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import { AccountPage } from '../modules/account'
import { ActivityHistoryPage } from '../modules/activity-history'
import { ApplicationsPage } from '../modules/applications'
import { AuditLogsPage } from '../modules/audit-logs'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '../modules/auth'
import { DashboardPage } from '../modules/dashboard'
import { DocumentsPage } from '../modules/documents'
import { EmployeesPage, EmployeeCreatePage, EmployeeProfilePage } from '../modules/employees/index'
import { FollowUpsPage } from '../modules/follow-ups'
import { CommunicationHubPage } from '../modules/communications'
import { WhatsAppInboxPage } from '../modules/whatsapp'
import { EmailInboxPage } from '../modules/email'
import { CampaignsPage } from '../modules/campaigns'
import { MetaLeadsPage } from '../modules/meta-leads'
import { LeadCreatePage, LeadDetailsPage, LeadPoolPage, LeadsPage, MyLeadsPage } from '../modules/leads'
import { MasterDataPage, MasterDataItemsPage } from '../modules/master-data'
import { PaymentsPage } from '../modules/payments'
import { ProfilePage } from '../modules/profile'
import { ReportsPage } from '../modules/reports'
import { RolesPage } from '../modules/roles/index'
import { SettingsPage } from '../modules/settings'
import { ServiceCatalogPage } from '../modules/service-items'
import { StudentsPage } from '../modules/students'
import { UsersPage } from '../modules/users/index'
import PermissionRoute from './PermissionRoute'
import ProtectedRoute from './ProtectedRoute'

const routes = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/account', element: <AccountPage /> },

          {
            element: (
              <PermissionRoute
                permission="lead:assign"
                deniedTitle="Lead Pool"
                deniedMessage="You do not have permission to access the Lead Pool."
              />
            ),
            children: [{ path: '/leads/pool', element: <LeadPoolPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission="lead:view"
                deniedTitle="My Leads"
                deniedMessage="You do not have permission to access this page."
              />
            ),
            children: [{ path: '/leads/mine', element: <MyLeadsPage /> }],
          },
          {
            element: <PermissionRoute permission="lead:view" />,
            children: [
              { path: '/leads', element: <LeadsPage /> },
              { path: '/leads/new', element: <LeadCreatePage /> },
              { path: '/leads/:id/edit', element: <LeadCreatePage /> },
              { path: '/leads/:id', element: <LeadDetailsPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="lead:convert" />,
            children: [
              { path: '/applications', element: <ApplicationsPage /> },
              { path: '/students', element: <StudentsPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="document:view" />,
            children: [{ path: '/documents', element: <DocumentsPage /> }],
          },
          {
            element: <PermissionRoute permission="payment:view" />,
            children: [{ path: '/payments', element: <PaymentsPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission="service:view"
                deniedTitle="Service & Package Management"
                deniedMessage="You do not have permission to view services and packages."
              />
            ),
            children: [{ path: '/service-items', element: <ServiceCatalogPage /> }],
          },
          {
            element: <PermissionRoute permission="follow_up:view" />,
            children: [{ path: '/follow-ups', element: <FollowUpsPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission="communication:view"
                deniedTitle="Communication Hub"
                deniedMessage="You do not have permission to access this communication."
              />
            ),
            children: [{ path: '/communications', element: <CommunicationHubPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission="communication:view"
                deniedTitle="WhatsApp Inbox"
                deniedMessage="You do not have permission to access this conversation."
              />
            ),
            children: [{ path: '/whatsapp', element: <WhatsAppInboxPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission="communication:view"
                deniedTitle="Email Communication"
                deniedMessage="You do not have permission to access this email."
              />
            ),
            children: [{ path: '/email', element: <EmailInboxPage /> }],
          },
          {
            element: (
              <PermissionRoute
                permission={['communication:view', 'campaign:view']}
                deniedTitle="Meta Lead Ads"
                deniedMessage="You do not have permission to view Meta leads."
              />
            ),
            children: [{ path: '/meta-leads', element: <MetaLeadsPage /> }],
          },
          {
            element: <PermissionRoute permission="campaign:view" />,
            children: [{ path: '/campaigns', element: <CampaignsPage /> }],
          },
          {
            element: <PermissionRoute permission="activity:view" />,
            children: [{ path: '/activity-history', element: <ActivityHistoryPage /> }],
          },
          {
            element: <PermissionRoute permission="report:view" />,
            children: [{ path: '/reports', element: <ReportsPage /> }],
          },
          {
            element: <PermissionRoute permission="employee:create" />,
            children: [{ path: '/employees/new', element: <EmployeeCreatePage /> }],
          },
          {
            element: <PermissionRoute permission="employee:edit" />,
            children: [{ path: '/employees/:id/edit', element: <EmployeeCreatePage /> }],
          },
          {
            element: <PermissionRoute permission="employee:view" />,
            children: [
              { path: '/employees', element: <EmployeesPage /> },
              { path: '/employees/:id', element: <EmployeeProfilePage /> },
            ],
          },
          {
            element: <PermissionRoute permission="user:view" />,
            children: [{ path: '/users', element: <UsersPage /> }],
          },
          {
            element: <PermissionRoute permission="role:view" />,
            children: [{ path: '/roles', element: <RolesPage /> }],
          },
          {
            element: <PermissionRoute permission="audit:view" />,
            children: [{ path: '/audit-logs', element: <AuditLogsPage /> }],
          },
          {
            element: <PermissionRoute permission="master_data:view" />,
            children: [
              { path: '/master-data', element: <MasterDataPage /> },
              { path: '/master-data/:groupSlug', element: <MasterDataItemsPage /> },
              { path: '/master-data/:groupSlug/:categoryKey', element: <MasterDataItemsPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="settings:view" />,
            children: [{ path: '/settings', element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <ProtectedRoute guestOnly>
            <LoginPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <ProtectedRoute guestOnly>
            <ForgotPasswordPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <ProtectedRoute guestOnly>
            <ResetPasswordPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  { path: '*', element: <Navigate to="/login" replace /> },
]

const router = createBrowserRouter(routes)

export { router }
export default router
