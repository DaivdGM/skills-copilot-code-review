document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement banner elements
  const announcementBanner = document.querySelector(".announcement-banner");
  const announcementText = document.getElementById("announcement-text");

  // Announcement admin elements
  const manageAnnouncementsButton = document.getElementById(
    "manage-announcements-button"
  );
  const announcementsModal = document.getElementById("announcements-modal");
  const closeAnnouncementsModal = document.querySelector(
    ".close-announcements-modal"
  );
  const announcementsAdminMessage = document.getElementById(
    "announcements-admin-message"
  );
  const announcementsAdminList = document.getElementById(
    "announcements-admin-list"
  );
  const announcementForm = document.getElementById("announcement-form");
  const announcementFormTitle = document.getElementById("announcement-form-title");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementMessageInput = document.getElementById("announcement-message");
  const announcementStartDateInput = document.getElementById(
    "announcement-start-date"
  );
  const announcementExpirationDateInput = document.getElementById(
    "announcement-expiration-date"
  );
  const announcementSubmitButton = document.getElementById(
    "announcement-submit-button"
  );
  const announcementCancelEditButton = document.getElementById(
    "announcement-cancel-edit"
  );

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // Authentication state
  let currentUser = null;

  // Announcement state
  let activeAnnouncements = [];
  let adminAnnouncements = [];
  let activeAnnouncementIndex = 0;
  let announcementRotationInterval = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" },
    afternoon: { start: "15:00", end: "18:00" },
    weekend: { days: ["Saturday", "Sunday"] },
  };

  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function setDayFilter(day) {
    currentDay = day;
    dayFilters.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.day === day);
    });
    fetchActivities();
  }

  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;
    timeFilters.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.time === timeRange);
    });
    fetchActivities();
  }

  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout();
      }
    }

    updateAuthBodyClass();
  }

  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        logout();
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
      manageAnnouncementsButton.classList.remove("hidden");
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
      manageAnnouncementsButton.classList.add("hidden");
      closeAnnouncementsModalHandler();
    }

    updateAuthBodyClass();
    fetchActivities();
  }

  function updateAuthBodyClass() {
    document.body.classList.toggle("not-authenticated", !currentUser);
  }

  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(data.detail || "Invalid username or password", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num, 10));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    return details.schedule;
  }

  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }
    if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    }
    if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    }
    if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }
    if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    return "academic";
  }

  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      const queryParams = [];

      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];
        if (currentTimeRange !== "weekend" && range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      allActivities = activities;
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayFilteredActivities() {
    activitiesList.innerHTML = "";

    const filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];
    const formattedSchedule = formatSchedule(details);

    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Announcement helpers
  function formatAnnouncementDate(dateValue) {
    if (!dateValue) {
      return "Starts immediately";
    }

    const parsedDate = new Date(`${dateValue}T00:00:00`);
    return parsedDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getAnnouncementStatusLabel(announcement) {
    const today = new Date();
    const start = announcement.start_date
      ? new Date(`${announcement.start_date}T00:00:00`)
      : null;
    const expiration = new Date(`${announcement.expiration_date}T00:00:00`);

    if (start && start > today) {
      return `Scheduled ${formatAnnouncementDate(announcement.start_date)}`;
    }

    if (expiration < today) {
      return "Expired";
    }

    return `Expires ${formatAnnouncementDate(announcement.expiration_date)}`;
  }

  function renderCurrentAnnouncement() {
    if (!activeAnnouncements.length) {
      announcementText.textContent = "No active announcements at this time.";
      announcementBanner.classList.add("announcement-idle");
      return;
    }

    announcementBanner.classList.remove("announcement-idle");
    const item = activeAnnouncements[activeAnnouncementIndex % activeAnnouncements.length];
    announcementText.textContent = `${item.message} (${getAnnouncementStatusLabel(item)})`;
    announcementBanner.classList.remove("announce-flash");
    void announcementBanner.offsetWidth;
    announcementBanner.classList.add("announce-flash");
  }

  function startAnnouncementRotation() {
    if (announcementRotationInterval) {
      clearInterval(announcementRotationInterval);
      announcementRotationInterval = null;
    }

    if (activeAnnouncements.length <= 1) {
      return;
    }

    announcementRotationInterval = window.setInterval(() => {
      activeAnnouncementIndex =
        (activeAnnouncementIndex + 1) % activeAnnouncements.length;
      renderCurrentAnnouncement();
    }, 7000);
  }

  async function fetchActiveAnnouncements() {
    try {
      const response = await fetch("/announcements/active");
      if (!response.ok) {
        throw new Error("Failed to fetch active announcements");
      }

      activeAnnouncements = await response.json();
      activeAnnouncementIndex = 0;
      renderCurrentAnnouncement();
      startAnnouncementRotation();
    } catch (error) {
      console.error("Error fetching active announcements:", error);
      activeAnnouncements = [];
      renderCurrentAnnouncement();
    }
  }

  function showAnnouncementsAdminMessage(text, type) {
    announcementsAdminMessage.textContent = text;
    announcementsAdminMessage.className = `message ${type}`;
    announcementsAdminMessage.classList.remove("hidden");

    setTimeout(() => {
      announcementsAdminMessage.classList.add("hidden");
    }, 5000);
  }

  function clearAnnouncementForm() {
    announcementIdInput.value = "";
    announcementMessageInput.value = "";
    announcementStartDateInput.value = "";
    announcementExpirationDateInput.value = "";
    announcementFormTitle.textContent = "Create Announcement";
    announcementSubmitButton.textContent = "Add Announcement";
    announcementCancelEditButton.classList.add("hidden");
  }

  function populateAnnouncementForm(announcement) {
    announcementIdInput.value = announcement.id;
    announcementMessageInput.value = announcement.message;
    announcementStartDateInput.value = announcement.start_date || "";
    announcementExpirationDateInput.value = announcement.expiration_date;
    announcementFormTitle.textContent = "Edit Announcement";
    announcementSubmitButton.textContent = "Save Changes";
    announcementCancelEditButton.classList.remove("hidden");
  }

  function renderAnnouncementsAdminList() {
    announcementsAdminList.innerHTML = "";

    if (!adminAnnouncements.length) {
      announcementsAdminList.innerHTML =
        '<p class="muted-text">No announcements found. Create one from the form.</p>';
      return;
    }

    adminAnnouncements.forEach((announcement) => {
      const item = document.createElement("article");
      item.className = "announcement-item";
      item.innerHTML = `
        <p class="announcement-item-message">${announcement.message}</p>
        <div class="announcement-item-meta">
          <span>${announcement.start_date ? `Starts ${formatAnnouncementDate(announcement.start_date)}` : "Starts immediately"}</span>
          <span>Expires ${formatAnnouncementDate(announcement.expiration_date)}</span>
        </div>
        <div class="announcement-item-actions">
          <button class="announcement-edit" data-id="${announcement.id}" type="button">Edit</button>
          <button class="announcement-delete" data-id="${announcement.id}" type="button">Delete</button>
        </div>
      `;

      item.querySelector(".announcement-edit").addEventListener("click", () => {
        populateAnnouncementForm(announcement);
      });

      item.querySelector(".announcement-delete").addEventListener("click", () => {
        showConfirmationDialog(
          "Delete this announcement? This action cannot be undone.",
          async () => {
            await deleteAnnouncement(announcement.id);
          }
        );
      });

      announcementsAdminList.appendChild(item);
    });
  }

  async function fetchAllAnnouncementsForAdmin() {
    if (!currentUser) {
      return;
    }

    announcementsAdminList.innerHTML = '<p class="muted-text">Loading announcements...</p>';

    try {
      const response = await fetch(
        `/announcements?teacher_username=${encodeURIComponent(currentUser.username)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }

      adminAnnouncements = await response.json();
      renderAnnouncementsAdminList();
    } catch (error) {
      console.error("Error loading announcement management data:", error);
      announcementsAdminList.innerHTML =
        '<p class="muted-text">Could not load announcements right now.</p>';
      showAnnouncementsAdminMessage(
        "Could not load announcements. Please try again.",
        "error"
      );
    }
  }

  async function deleteAnnouncement(announcementId) {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(
        `/announcements/${encodeURIComponent(
          announcementId
        )}?teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      showAnnouncementsAdminMessage("Announcement deleted.", "success");
      clearAnnouncementForm();
      await fetchAllAnnouncementsForAdmin();
      await fetchActiveAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      showAnnouncementsAdminMessage(
        "Unable to delete announcement. Please try again.",
        "error"
      );
    }
  }

  function openAnnouncementsModal() {
    if (!currentUser) {
      showMessage("Sign in to manage announcements.", "error");
      return;
    }

    announcementsModal.classList.remove("hidden");
    announcementsModal.classList.add("show");
    announcementsModal.setAttribute("aria-hidden", "false");
    clearAnnouncementForm();
    fetchAllAnnouncementsForAdmin();
  }

  function closeAnnouncementsModalHandler() {
    announcementsModal.classList.remove("show");
    announcementsModal.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      announcementsModal.classList.add("hidden");
    }, 300);
  }

  manageAnnouncementsButton.addEventListener("click", openAnnouncementsModal);
  closeAnnouncementsModal.addEventListener("click", closeAnnouncementsModalHandler);

  announcementCancelEditButton.addEventListener("click", () => {
    clearAnnouncementForm();
  });

  announcementForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showAnnouncementsAdminMessage("Sign in to manage announcements.", "error");
      return;
    }

    const id = announcementIdInput.value.trim();
    const message = announcementMessageInput.value.trim();
    const startDate = announcementStartDateInput.value || null;
    const expirationDate = announcementExpirationDateInput.value;

    if (!message) {
      showAnnouncementsAdminMessage("Message is required.", "error");
      return;
    }

    if (!expirationDate) {
      showAnnouncementsAdminMessage("Expiration date is required.", "error");
      return;
    }

    if (startDate && new Date(startDate) > new Date(expirationDate)) {
      showAnnouncementsAdminMessage(
        "Start date cannot be after expiration date.",
        "error"
      );
      return;
    }

    const payload = {
      message,
      start_date: startDate,
      expiration_date: expirationDate,
    };

    const endpoint = id
      ? `/announcements/${encodeURIComponent(
          id
        )}?teacher_username=${encodeURIComponent(currentUser.username)}`
      : `/announcements?teacher_username=${encodeURIComponent(currentUser.username)}`;

    const method = id ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save announcement");
      }

      showAnnouncementsAdminMessage(
        id ? "Announcement updated." : "Announcement added.",
        "success"
      );
      clearAnnouncementForm();
      await fetchAllAnnouncementsForAdmin();
      await fetchActiveAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      showAnnouncementsAdminMessage(
        "Unable to save announcement. Please try again.",
        "error"
      );
    }
  });

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  closeRegistrationModal.addEventListener("click", closeRegistrationModalHandler);

  function showConfirmationDialog(text, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn" type="button">Cancel</button>
            <button id="confirm-button" class="confirm-btn" type="button">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);
    }

    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = text;

    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });
  }

  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
          } else {
            showMessage("Unable to unregister student right now.", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
      } else {
        showMessage("Unable to register student right now.", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }

    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }

    if (event.target === announcementsModal) {
      closeAnnouncementsModalHandler();
    }
  });

  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  checkAuthentication();
  initializeFilters();
  fetchActivities();
  fetchActiveAnnouncements();
});
