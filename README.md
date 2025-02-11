![Banner image](https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=200&q=80)

# Calenlist - Share Your Calendar, Build Your Community

Calenlist is a modern calendar sharing platform that lets you share your Google Calendar with your community while maintaining full control over your data. With a beautiful interface and seamless integration, Calenlist makes it easy to share events and build engagement.

![Calenlist.com - Screenshot](https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=630&q=80)

## Key Features

- **Google Calendar Integration**: Share your Google Calendar events with one click
- **Beautiful Interface**: Modern, responsive design that works on all devices
- **Full Control**: Choose what to share and who can see your events
- **Real-Time Updates**: Changes in your Google Calendar reflect instantly
- **Community Building**: Let subscribers follow your events directly in their calendars
- **Privacy First**: Self-hosted option available with our sustainable use license

## Quick Start

Try Calenlist instantly with npm (requires [Node.js](https://nodejs.org/en/)):

```bash
# Clone the repository
git clone https://github.com/greentechgear/calenlist.git

# Install dependencies
cd calenlist
npm install

# Start the development server
npm run dev
```

Or deploy with Docker:

```bash
docker build -t calenlist .
docker run -p 3000:3000 calenlist
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Supabase configuration
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Email configuration (for signup notifications)
ADMIN_EMAIL=your-admin-email@example.com
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=your-verified-sending-address@yourdomain.com
REPLY_TO_EMAIL=your-support-email@yourdomain.com
```

### Required Services

1. **Supabase Account**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from the project settings

2. **Resend Account** (for email notifications)
   - Sign up at [resend.com](https://resend.com)
   - Create an API key for sending emails
   - Verify your domain for sending emails
   - Configure FROM_EMAIL to use a verified domain
   - Set up REPLY_TO_EMAIL for handling responses

## Resources

- 📚 [Documentation](https://github.com/greentechgear/calenlist/wiki)
- 🔧 [Google Calendar Setup Guide](docs/google-calendar-setup.md)
- 💡 [Example Calendars](https://calenlist.com/examples)

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Calendar Integration**: Google Calendar API
- **Icons**: Lucide React
- **Email**: Resend

## License

Calenlist is distributed under the [Sustainable Use License](LICENSE).

- **Source Available**: Always visible source code
- **Self-Hostable**: Deploy anywhere
- **Free for Non-Commercial Use**: Perfect for communities and personal use

## Contributing

Found a bug 🐛 or have a feature idea ✨? We'd love your help! Check our [Contributing Guide](CONTRIBUTING.md) to get started.

## Security

For security issues, please email security@calenlist.com instead of using the issue tracker.

## What does Calenlist mean?

**Short answer**: It combines "Calendar" and "List" - a simple way to list and share your calendars.

**Long answer**: We wanted a name that reflected both the simplicity and functionality of our platform. "Calen" comes from "Calendar" - the core of what we do, and "list" represents the act of sharing and organizing these calendars in an accessible way. Together, they form "Calenlist" - your hub for sharing calendars and building community.