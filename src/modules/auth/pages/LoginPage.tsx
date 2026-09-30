import { Link, useNavigate } from 'react-router-dom'
import { Button, Form } from 'antd'
import { toast } from 'react-toastify'
import { FormCheckbox, FormInput } from '@/components/common/Forms'
import { PageMeta } from '@/components/common/Meta'
import { useAuth } from '../../../hooks/useAuth'
import { isAuthSession } from '@/lib/auth'
import { loginIdentifierValidationError } from '../identifier'
import { useLoginMutation } from '../../../redux/features/auth/authApi'

type LoginValues = {
  identifier: string
  password: string
  rememberMe?: boolean
}

type LoginField = 'identifier' | 'password'

type LoginApiError = {
  data?: { error?: string; message?: string; code?: string; field?: string }
  status?: string | number
}

const IDENTIFIER_ERROR_CODES = new Set([
  'ACCOUNT_LOCKED',
  'ACCOUNT_INACTIVE',
  'ACCOUNT_SUSPENDED',
  'ROLE_MISSING',
])

const cardClass =
  'w-full max-w-[400px] rounded-2xl border border-card-border bg-surface p-6 shadow-card'

const formClass =
  '[&_.ant-form-item-label>label]:text-[0.9rem] [&_.ant-form-item-label>label]:font-semibold [&_.ant-form-item-label>label]:text-text-strong'

export default function LoginPage() {
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const [login, { isLoading }] = useLoginMutation()
  const [form] = Form.useForm<LoginValues>()

  function showFieldError(text: string, field: LoginField) {
    form.setFields([
      { name: 'identifier', errors: field === 'identifier' ? [text] : [] },
      { name: 'password', errors: field === 'password' ? [text] : [] },
    ])
  }

  function errorField(code?: string, field?: string): LoginField {
    if (field === 'identifier' || field === 'password') return field
    if (code === 'INVALID_CREDENTIALS') return 'password'
    if (!code || IDENTIFIER_ERROR_CODES.has(code)) return 'identifier'
    return 'password'
  }

  async function onFinish(values: LoginValues) {
    form.setFields([
      { name: 'identifier', errors: [] },
      { name: 'password', errors: [] },
    ])

    try {
      const data = await login({
        identifier: values.identifier.trim(),
        password: values.password,
        rememberMe: Boolean(values.rememberMe),
      }).unwrap()

      if (isAuthSession(data)) {
        applySession(data)
        toast.success('Signed in successfully')
        navigate('/dashboard', { replace: true })
        return
      }

      showFieldError('Could not sign in.', 'identifier')
    } catch (error) {
      const err = error as LoginApiError
      const text =
        err?.data?.error ||
        err?.data?.message ||
        (err?.status === 'FETCH_ERROR'
          ? 'Server is not reachable. Start campusly-crm-api.'
          : 'Could not sign in.')
      showFieldError(text, errorField(err?.data?.code, err?.data?.field))
    }
  }

  return (
    <>
      <PageMeta
        title="Sign In"
        description="Sign in to EduConsult CRM to manage leads, applications, students, and team operations."
      />
      <div className={cardClass}>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ rememberMe: false }}
          onFinish={onFinish}
          className={formClass}
        >
          <div className="mb-6 text-center">
            <h1 className="m-0 mb-1.5 text-[1.55rem] leading-tight font-bold tracking-tight text-text-strong">
              Welcome back
            </h1>
            <p className="m-0 text-[0.92rem] text-text-muted">Sign in to continue to your dashboard</p>
          </div>

          <FormInput
            name="identifier"
            label="Email or Username"
            rules={[
              { required: true, whitespace: true, message: 'Enter email or username' },
              {
                validator: async (_, value: string) => {
                  if (!value || !value.trim()) return
                  const error = loginIdentifierValidationError(value)
                  if (error) throw new Error(error)
                },
              },
            ]}
            autoComplete="username"
            placeholder="Email or username"
          />

          <FormInput.Password
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Enter password' }]}
            autoComplete="current-password"
            placeholder="Enter password"
          />

          <div className="mb-5 flex items-center justify-between gap-3">
            <Form.Item name="rememberMe" valuePropName="checked" className="mb-0!">
              <FormCheckbox className="text-text-muted">Remember me</FormCheckbox>
            </Form.Item>
            <Link
              to="/forgot-password"
              className="text-[0.85rem] font-semibold text-primary! no-underline hover:text-primary-hover! hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Form.Item className="mb-0!">
            <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  )
}
