import React, { createContext, useContext, useState } from 'react';

const translations = {
  vi: {
    // Navbar
    nav_courses: 'Khóa học',
    nav_timetable: 'Thời gian biểu',
    nav_forum: 'Diễn đàn',
    nav_guide: 'Hướng dẫn',
    nav_login: 'Đăng nhập',
    nav_logout: 'Đăng xuất',
    nav_dashboard: 'Dashboard',
    nav_profile: 'Thông tin cá nhân',
    nav_instructor: 'Quản lý giảng dạy',
    nav_create_course: 'Tạo khóa học',

    // Common
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    loading: 'Đang tải...',
    search: 'Tìm kiếm...',
    back: 'Quay lại',
    enroll: 'Đăng ký',
    continue_learning: 'Tiếp tục học',
    free: 'Miễn phí',
    today: 'Hôm nay',

    // Profile Page
    profile_title: 'Thông tin cá nhân',
    profile_subtitle: 'Quản lý hồ sơ và mật khẩu của bạn',
    profile_name: 'Họ và tên',
    profile_email: 'Email',
    profile_role: 'Vai trò',
    profile_avatar: 'Ảnh đại diện',
    profile_change_avatar: 'Thay đổi ảnh',
    profile_password_section: 'Đổi mật khẩu',
    profile_current_password: 'Mật khẩu hiện tại',
    profile_new_password: 'Mật khẩu mới',
    profile_confirm_password: 'Xác nhận mật khẩu mới',
    profile_save_success: 'Cập nhật thành công!',
    profile_password_mismatch: 'Mật khẩu mới không khớp',
    profile_password_wrong: 'Mật khẩu hiện tại không đúng',
    profile_leave_blank: '(để trống nếu không muốn đổi mật khẩu)',

    // Course
    course_catalog: 'Khóa học',
    course_subtitle: 'Tìm kiếm và chọn lựa các khóa học phù hợp với bạn',
    course_filter: 'Bộ lọc',
    course_category: 'Chủ đề',
    course_level: 'Cấp độ',
    course_price: 'Giá',
    course_all: 'Tất cả',
    course_paid: 'Có phí',
    course_lessons: 'bài',
    course_students: 'học viên',
    course_no_result: 'Không tìm thấy khóa học',
    course_no_result_sub: 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.',

    // Timetable
    timetable_title: 'Lịch Học & Sự Kiện',
    timetable_subtitle: 'Quản lý thời gian, xem deadline và tham gia buổi học',
    timetable_create: 'Tạo Lịch',
    timetable_by_course: 'Theo Môn Học',
    timetable_by_type: 'Loại Sự Kiện',
    timetable_lecture: 'Bài giảng',
    timetable_livestream: 'Livestream',
    timetable_deadline: 'Bài tập / Deadline',

    // Guide
    guide_need_help: 'Cần thêm hỗ trợ?',
    guide_help_desc: 'Nếu bạn gặp khó khăn, hãy đặt câu hỏi tại diễn đàn cộng đồng.',
    guide_go_forum: 'Đến Diễn đàn',
  },
  en: {
    // Navbar
    nav_courses: 'Courses',
    nav_timetable: 'Timetable',
    nav_forum: 'Forum',
    nav_guide: 'Guide',
    nav_login: 'Log In',
    nav_logout: 'Log Out',
    nav_dashboard: 'Dashboard',
    nav_profile: 'My Profile',
    nav_instructor: 'Instructor Panel',
    nav_create_course: 'Create Course',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    loading: 'Loading...',
    search: 'Search...',
    back: 'Back',
    enroll: 'Enroll',
    continue_learning: 'Continue Learning',
    free: 'Free',
    today: 'Today',

    // Profile Page
    profile_title: 'My Profile',
    profile_subtitle: 'Manage your personal information and password',
    profile_name: 'Full Name',
    profile_email: 'Email',
    profile_role: 'Role',
    profile_avatar: 'Avatar',
    profile_change_avatar: 'Change Photo',
    profile_password_section: 'Change Password',
    profile_current_password: 'Current Password',
    profile_new_password: 'New Password',
    profile_confirm_password: 'Confirm New Password',
    profile_save_success: 'Profile updated successfully!',
    profile_password_mismatch: 'New passwords do not match',
    profile_password_wrong: 'Current password is incorrect',
    profile_leave_blank: '(leave blank to keep current password)',

    // Course
    course_catalog: 'Courses',
    course_subtitle: 'Discover and enroll in courses that match your goals',
    course_filter: 'Filters',
    course_category: 'Category',
    course_level: 'Level',
    course_price: 'Price',
    course_all: 'All',
    course_paid: 'Paid',
    course_lessons: 'lessons',
    course_students: 'students',
    course_no_result: 'No courses found',
    course_no_result_sub: 'Try changing your search or filter settings.',

    // Timetable
    timetable_title: 'Timetable & Events',
    timetable_subtitle: 'Manage your schedule, deadlines and join live classes',
    timetable_create: 'New Event',
    timetable_by_course: 'Filter by Course',
    timetable_by_type: 'Event Type',
    timetable_lecture: 'Lecture',
    timetable_livestream: 'Livestream',
    timetable_deadline: 'Assignment / Deadline',

    // Guide
    guide_need_help: 'Need more help?',
    guide_help_desc: 'Post a question in the community forum — lecturers and students are happy to help!',
    guide_go_forum: 'Visit Forum',
  },
};

export const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi');

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  const t = (key) => translations[lang]?.[key] ?? translations['vi'][key] ?? key;

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
