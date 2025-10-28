# 🏠 OrderlyFlow

**The Ultimate Home Management & Maintenance App**

OrderlyFlow is a comprehensive React Native application built with Expo that helps homeowners and property managers organize, track, and maintain their homes efficiently. From task management to vendor coordination, warranty tracking to inventory management, OrderlyFlow provides all the tools needed to keep your home in perfect order.

![OrderlyFlow Banner](https://via.placeholder.com/800x200/4A90E2/FFFFFF?text=OrderlyFlow+-+Home+Management+Made+Simple)

## ✨ Features

### 🏡 **Home Management**
- **Multi-Home Support**: Manage multiple properties from a single dashboard
- **Property Details**: Track square footage, bedrooms, bathrooms, foundation type, and more
- **Photo Management**: Store and organize property photos
- **Location Services**: GPS coordinates and address management

### 📋 **Task Management**
- **Smart Task Templates**: Pre-built maintenance tasks for common home items
- **Custom Tasks**: Create personalized maintenance schedules
- **Recurring Tasks**: Set up automatic recurring maintenance reminders
- **Task Categories**: Organize by room, priority, and maintenance type
- **Progress Tracking**: Monitor completion status and history

### 🔧 **Repair & Project Tracking**
- **Repair Management**: Log and track home repairs with photos and notes
- **Project Planning**: Plan and execute home improvement projects
- **Cost Tracking**: Monitor budgets and actual expenses
- **Vendor Assignment**: Assign repairs and projects to specific vendors

### 📅 **Calendar Integration**
- **Maintenance Scheduling**: Visual calendar view of all maintenance tasks
- **Recurring Events**: Automatic generation of recurring maintenance events
- **Due Date Tracking**: Never miss important maintenance deadlines
- **Agenda View**: Quick overview of upcoming tasks

### 👥 **Vendor Management**
- **Contact Database**: Store vendor information, specialties, and contact details
- **Service History**: Track work performed by each vendor
- **Rating System**: Rate and review vendor performance
- **Quick Contact**: Direct calling and messaging integration

### 📦 **Inventory Management**
- **Appliance Tracking**: Monitor appliances, warranties, and maintenance schedules
- **Material Inventory**: Track paint colors, materials, and supplies
- **Warranty Management**: Never miss warranty expiration dates
- **Filter Management**: Track HVAC and water filter replacement schedules

### 🎨 **Paint & Material Tracking**
- **Color Database**: Store paint colors with brand, codes, and room locations
- **Material Inventory**: Track flooring, tiles, cabinets, and other materials
- **Purchase Records**: Maintain purchase history and receipts

### 🤖 **AI Assistant (Flo)**
- **Smart Recommendations**: Get personalized maintenance suggestions
- **Chat Interface**: Ask questions about home maintenance
- **Expert Advice**: Access to maintenance tips and best practices

### 👨‍👩‍👧‍👦 **Family Sharing**
- **Multi-User Support**: Share home management with family members
- **Role Management**: Assign different permission levels
- **Collaborative Tasks**: Work together on home maintenance

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Supabase Account** (for backend services)
- **iOS Simulator** (for iOS development)
- **Android Studio** (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/orderlyflow.git
   cd orderlyflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations from `sql/` directory
   - Configure Row Level Security (RLS) policies
   - Set up authentication providers

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

6. **Run on your preferred platform**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run web
   ```

## 🏗️ Project Structure

```
orderlyflow/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication screens
│   ├── (profile)/                # User profile screens
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── (dashboard)/          # Dashboard screens
│   │   ├── (home)/               # Home management screens
│   │   ├── (tasks)/              # Task management screens
│   │   ├── (vendors)/            # Vendor management screens
│   │   ├── (flo)/                # AI assistant screens
│   │   └── (settings)/           # Settings screens
│   └── _layout.tsx               # Root layout
├── components/                    # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── calendar/                 # Calendar components
│   ├── common/                   # Common UI components
│   ├── dashboard/                # Dashboard components
│   ├── forms/                    # Form components
│   ├── home/                     # Home management components
│   ├── layouts/                  # Layout components
│   ├── navigation/               # Navigation components
│   ├── settings/                 # Settings components
│   ├── tasks/                    # Task management components
│   ├── ui/                       # Basic UI components
│   └── vendors/                  # Vendor management components
├── lib/                          # Core library code
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── schemas/                  # Zod validation schemas
│   ├── services/                 # External service integrations
│   ├── utils/                    # Utility functions
│   └── supabase.ts               # Supabase client configuration
├── sql/                          # Database migrations and schemas
├── supabase/                     # Supabase configuration
├── types/                        # TypeScript type definitions
└── assets/                       # Static assets (images, fonts)
```

## 🛠️ Technology Stack

### **Frontend**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and toolchain
- **Expo Router** - File-based routing system
- **TypeScript** - Type-safe JavaScript
- **React Hook Form** - Form management
- **Zod** - Schema validation

### **Backend**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security** - Data security
- **Real-time subscriptions** - Live data updates

### **UI/UX**
- **React Native Paper** - Material Design components
- **Expo Vector Icons** - Icon library
- **React Native Calendars** - Calendar components
- **React Native Reanimated** - Smooth animations

### **Development Tools**
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Expo Dev Client** - Development builds
- **EAS Build** - Cloud builds

## 📱 Screenshots

| Dashboard | Task Management | Calendar View | Vendor Management |
|-----------|----------------|---------------|-------------------|
| ![Dashboard](https://via.placeholder.com/200x400/4A90E2/FFFFFF?text=Dashboard) | ![Tasks](https://via.placeholder.com/200x400/50C878/FFFFFF?text=Tasks) | ![Calendar](https://via.placeholder.com/200x400/FF6B6B/FFFFFF?text=Calendar) | ![Vendors](https://via.placeholder.com/200x400/FFD93D/FFFFFF?text=Vendors) |

## 🔧 Configuration

### **Environment Variables**
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Google Places API (for address autocomplete)
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

### **Database Setup**
1. Create a new Supabase project
2. Run the SQL migrations from the `sql/` directory
3. Configure authentication providers
4. Set up Row Level Security policies
5. Configure real-time subscriptions

## 🚀 Deployment

### **EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for production
eas build --platform all
```

### **Manual Build**
```bash
# Generate TypeScript types
npm run types

# Build for iOS
npm run ios

# Build for Android
npm run android
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-username/orderlyflow/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/orderlyflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/orderlyflow/discussions)
- **Email**: support@orderlyflow.app

## 🙏 Acknowledgments

- **Expo Team** - For the amazing development platform
- **Supabase Team** - For the powerful backend services
- **React Native Community** - For the extensive ecosystem
- **Contributors** - Thank you to all contributors who help improve OrderlyFlow

## 📊 Project Status

![GitHub stars](https://img.shields.io/github/stars/your-username/orderlyflow?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/orderlyflow?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/orderlyflow)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/orderlyflow)
![License](https://img.shields.io/github/license/your-username/orderlyflow)

---

**Made with ❤️ by the OrderlyFlow Team**

*Keep your home organized, one task at a time.*