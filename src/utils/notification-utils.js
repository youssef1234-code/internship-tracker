import { saveToStore, getAllFromStore } from "./indexedDB-utils";

/**
 * Add a new notification to the system
 * @param {Object} notification - The notification object
 * @param {string} notification.message - The notification message
 * @param {string} [notification.email] - The email of the specific user (optional)
 * @param {string} [notification.userRole] - The role of users who should receive this notification (optional)
 * @param {string} [notification.link] - URL to navigate to when clicked (optional)
 * @param {boolean} [notification.global=false] - Whether this is a global notification for all users
 * @param {boolean} [notification.read=false] - Whether this notification is already read
 * @returns {Promise<Object>} - The saved notification object with generated ID
 */
export const addNotification = async (notification) => {
  try {
    // Validate required fields
    if (!notification.message) {
      throw new Error("Notification message is required");
    }

    // Check that at least one targeting method is specified
    if (!notification.email && !notification.userRole && !notification.global) {
      throw new Error(
        "Notification must target at least one user via email, userRole, or global flag"
      );
    }

    // Generate notification ID and add metadata
    const newNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      date: new Date().toISOString(),
      read: notification.read || false,
      global: notification.global || false,
    };

    // Save to IndexedDB
    await saveToStore("notifications", newNotification);
    window.dispatchEvent(new Event("notificationAdded"));

    return newNotification;
  } catch (error) {
    console.error("Failed to add notification:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {Promise<Object>} - The updated notification object
 */
export const markAsRead = async (notificationId) => {
  try {
    // Get all notifications
    const allNotifications = await getAllFromStore("notifications");

    // Find the notification
    const notification = allNotifications.find((n) => n.id === notificationId);
    if (!notification) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    // Update the notification
    const updatedNotification = { ...notification, read: true };

    // Save to IndexedDB
    await saveToStore("notifications", updatedNotification);

    return updatedNotification;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a specific user
 * @param {Object} user - The user object with email and role
 * @returns {Promise<Array>} - Array of updated notification objects
 */
export const markAllAsReadForUser = async (user) => {
  try {
    if (!user || !user.email) {
      throw new Error("User email is required");
    }

    // Get user notifications
    const userNotifications = await getUserNotifications(user);

    // Mark all as read
    const updatedNotifications = [];
    for (const notification of userNotifications) {
      if (!notification.read) {
        const updated = { ...notification, read: true };
        await saveToStore("notifications", updated);
        updatedNotifications.push(updated);
      } else {
        updatedNotifications.push(notification);
      }
    }

    return updatedNotifications;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
};

/**
 * Add a notification for a specific user
 * @param {string} email - The user's email
 * @param {string} message - The notification message
 * @param {string} [link] - URL to navigate to when clicked (optional)
 * @returns {Promise<Object>} - The saved notification
 */
export const addUserNotification = async (email, message, link = null) => {
  return addNotification({
    email,
    message,
    link,
    read: false,
    global: false,
  });
};

/**
 * Add a notification for all users with a specific role
 * @param {string} userRole - The user role (e.g., "student", "company")
 * @param {string} message - The notification message
 * @param {string} [link] - URL to navigate to when clicked (optional)
 * @returns {Promise<Object>} - The saved notification
 */
export const addRoleNotification = async (userRole, message, link = null) => {
  return addNotification({
    userRole,
    message,
    link,
    read: false,
    global: false,
  });
};

/**
 * Add a global notification for all users
 * @param {string} message - The notification message
 * @param {string} [link] - URL to navigate to when clicked (optional)
 * @returns {Promise<Object>} - The saved notification
 */
export const addGlobalNotification = async (message, link = null) => {
  return addNotification({
    message,
    link,
    read: false,
    global: true,
  });
};

/**
 * Get notifications for a specific user
 * @param {Object} user - The user object with email and role
 * @returns {Promise<Array>} - Array of notification objects
 */
export const getUserNotifications = async (user) => {
  try {
    if (!user || !user.email) {
      throw new Error("User email is required");
    }

    // Get all notifications from IndexedDB
    const allNotifications = await getAllFromStore("notifications");

    // Filter for the current user
    const userNotifications = allNotifications.filter(
      (notification) =>
        notification.email === user.email ||
        notification.userRole === user.role ||
        (notification.userRole === "student" && user.role === "pro_student") ||
        notification.global
    );

    // Sort by date (newest first)
    userNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    return userNotifications;
  } catch (error) {
    console.error("Failed to get user notifications:", error);
    return [];
  }
};

/**
 * Delete a notification by ID
 * @param {string} notificationId - The ID of the notification to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    // Get all notifications
    const allNotifications = await getAllFromStore("notifications");

    // Find the notification to delete
    const notificationToDelete = allNotifications.find(
      (n) => n.id === notificationId
    );

    if (!notificationToDelete) {
      throw new Error(`Notification with ID ${notificationId} not found`);
    }

    // Delete by adding a "_deleted" flag (IndexedDB doesn't have a built-in delete)
    // In a real application, you would implement proper deletion in your IndexedDB utilities
    await saveToStore("notifications", {
      ...notificationToDelete,
      _deleted: true,
    });

    return true;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return false;
  }
};
