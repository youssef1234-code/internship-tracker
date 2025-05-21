Internship Tracker

An all-in-one web application for managing internship processes, connecting students, companies, and school administration.

## Preview
![image](https://github.com/user-attachments/assets/06603f5a-0959-4e4c-965b-0eac45acb969)
![image](https://github.com/user-attachments/assets/ae4069d2-3453-4fbe-83e8-bb2edae96c24)
![image](https://github.com/user-attachments/assets/36c6925a-9084-44e7-b249-7f28fff8e883)
![image](https://github.com/user-attachments/assets/653cb1d8-77b3-48d1-b67d-84eec68c53c3)
![image](https://github.com/user-attachments/assets/f0a2ad68-6d6e-4c84-ac39-cf909c146cdf)
![image](https://github.com/user-attachments/assets/b6d269bd-4295-443b-81a5-8514f8fe564a)
![image](https://github.com/user-attachments/assets/4e36a94e-6d43-4e21-9820-7ea6094ada00)
![image](https://github.com/user-attachments/assets/81298d3e-a6da-449c-8b56-478f37cecda5)
![image](https://github.com/user-attachments/assets/fac05b06-51d1-4144-99ee-829237da2e9e)
![image](https://github.com/user-attachments/assets/1fdd80d9-7491-401a-8264-5af5affc2fac)
![image](https://github.com/user-attachments/assets/ebd2cca8-7145-4d11-8cd4-d9d7b1c8ae30)
![image](https://github.com/user-attachments/assets/86eacd08-19df-44b1-ac49-79fc77beaaaa)
![image](https://github.com/user-attachments/assets/a19f31ed-1ffa-4864-9a6b-a2a8d56aded2)

## Overview

The Internship Tracker is a comprehensive platform designed to facilitate and streamline the internship management process for all stakeholders involved. The application serves three primary user roles: students, companies, and school administration (SCAD office) / faculty members.

## Features

### For Students

- **Profile Management**: Create and maintain a professional profile
- **Internship Applications**: Browse, search, and apply for available internships
- **Application Tracking**: Monitor the status of submitted applications
- **Internship Reporting**: Submit and track internship reports
- **Workshop Management**: Register and attend workshops (PRO students)
- **Video Appointments**: Book and attend virtual meetings with SCAD office (PRO students)
- **Assessments**: Complete online assessments (PRO students)
- **Company Evaluation**: Evaluate internship experiences

### For Companies

- **Profile Management**: Create and maintain company profiles
- **Internship Posting**: Create and publish internship opportunities
- **Application Review**: View and evaluate student applications
- **Intern Management**: Track current and completed interns
- **Performance Evaluation**: Evaluate intern performance

### For SCAD Office / Faculty

- **Dashboard**: Overview of internship program metrics
- **Company Approvals**: Review and approve company registrations
- **Student Management**: View and manage student profiles
- **Report Review**: Evaluate and provide feedback on student internship reports
- **Workshop Creation**: Create and manage professional workshops
- **Appointment Management**: Schedule and conduct virtual meetings with students
- **Internship Cycle Settings**: Configure internship program parameters
- **Intern Evaluations**: Review company evaluations of student performance

### Common Features

- **Authentication**: Secure login and role-based access
- **Email Communication**: Send and receive system notifications

## Technical Architecture

The application is built using:

- **React**: Frontend UI framework
- **React Router**: Page navigation and routing
- **Tailwind CSS & Shadcn UI**: Styling and component library
- **Framer Motion**: Animation library
- **IndexedDB**: Client-side data storage
- **Lucide React**: Icon library

## Application Structure

### Core Components

- **Authentication**: User registration and login
- **Layout**: Application shell and navigation
- **UI Components**: Reusable interface elements

### Role-Specific Modules

- **Student Module**: Components for student users
- **Company Module**: Components for company users
- **SCAD Office Module**: Components for administrative users
- **Internship Module**: Common internship-related features

### Data Management

The application uses IndexedDB for client-side data storage with the following stores:

- studentProfiles
- companyProfiles
- Internships
- InternshipApplications
- InternshipEvaluations
- workshops
- scadAppointments
- studentAppointments
- notifications
- emails
- AssessmentResults
- companyViews

## Routes

### Public Routes

- `/login` - User authentication
- `/register` - Company registration
- `/mailbox` - Email system

### Protected Routes

#### Common

- `/internships` - Browse all internships
- `/appointment` - Video appointment system

#### Student Routes

- `/student/profile` - Student profile management
- `/student/help` - Help resources
- `/student/applications` - Application management
- `/student/internships` - View active/past internships
- `/student/CompanyEvaluation` - Evaluate internship experience
- `/student/workshops` - Workshop registration (PRO)
- `/student/assessments` - Online assessments (PRO)
- `/student/appointment` - Video appointments (PRO)

#### Company Routes

- `/company/post` - Create internship postings
- `/company/internships` - Manage company internships
- `/company/applications` - Review student applications
- `/company/interns` - Manage current interns
- `/company/evaluate/:id` - Evaluate intern performance

#### SCAD Office Routes

- `/scad` - Admin dashboard
- `/scad/companies` - Company approval management
- `/scad/students` - Student management
- `/scad/reports` - Report review
- `/scad/workshops` - Workshop management
- `/scad/cycle` - Internship cycle settings
- `/scad/intern-evaluations` - Review intern evaluations
- `/scad/appointment` - Appointment management

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the application in your browser at `http://localhost:5173`

## PRO Student Features

The application includes special features for PRO students, which are students who have completed at least 90 days of internship experience. These features include:

- Workshop attendance
- Video appointments with SCAD office
- Online assessments

## UI Components

The application uses a library of reusable UI components, such as:

- Cards
- Tabs
- Dialogs
- Forms
- Tables
- Buttons
- and more

These components are built using Shadcn UI combined with Tailwind CSS for consistent styling throughout the application.
