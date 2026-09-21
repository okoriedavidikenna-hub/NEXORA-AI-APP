/* ============================================================
   NEXORA AI 13
   FRONTEND CONTROLLER
   DAVIDS DIGITALS LTD.©
   ============================================================ */

const API_BASE = "https://nexora-ai-1-r9y5.onrender.com";


/* ============================================================
   STATE
   ============================================================ */

let currentUser = null;
let currentConversationId = null;
let conversations = [];
let resetToken = null;
let renameConversationId = null;


/* ============================================================
   DOM HELPERS
   ============================================================ */

const $ = (id) => document.getElementById(id);

function show(element) {
    if (element) {
        element.style.display = "";
    }
}

function hide(element) {
    if (element) {
        element.style.display = "none";
    }
}


/* ============================================================
   API
   ============================================================ */

async function api(
    endpoint,
    options = {}
) {

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    try {

        const response = await fetch(
            API_BASE + endpoint,
            config
        );

        const data = await response.json()
            .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Something went wrong."
            );
        }

        return data;

    } catch (error) {

        console.error(
            "NEXORA API error:",
            error
        );

        throw error;
    }
}


/* ============================================================
   AUTH MESSAGE
   ============================================================ */

function setAuthMessage(
    message,
    type = ""
) {

    const box = $("authMessage");

    if (!box) return;

    box.textContent = message;

    box.className =
        "auth-message " + type;
}


/* ============================================================
   AUTH SCREENS
   ============================================================ */

function showAuthScreen(
    screen
) {

    hide($("loginScreen"));
    hide($("signupScreen"));
    hide($("forgotPasswordScreen"));
    hide($("resetPasswordScreen"));

    show($(screen));

    setAuthMessage("");
}


/* ============================================================
   SAVE USER
   ============================================================ */

function saveUser(user) {

    currentUser = user;

    localStorage.setItem(
        "nexora_user",
        JSON.stringify(user)
    );
}


/* ============================================================
   LOAD USER
   ============================================================ */

function loadUser() {

    try {

        const saved =
            localStorage.getItem(
                "nexora_user"
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(
            saved
        );

    } catch {

        return null;
    }
}


/* ============================================================
   LOGOUT
   ============================================================ */

function logout() {

    currentUser = null;
    currentConversationId = null;

    localStorage.removeItem(
        "nexora_user"
    );

    hide($("app"));
    show($("authScreen"));

    showAuthScreen(
        "loginScreen"
    );

    $("loginEmail").value = "";
    $("loginPassword").value = "";

    setAuthMessage("");
}


/* ============================================================
   LOGIN
   ============================================================ */

async function login() {

    const email =
        $("loginEmail").value.trim();

    const password =
        $("loginPassword").value;

    if (!email) {

        setAuthMessage(
            "Please enter your email.",
            "error"
        );

        return;
    }

    if (!password) {

        setAuthMessage(
            "Please enter your password.",
            "error"
        );

        return;
    }

    const button =
        $("loginBtn");

    button.disabled = true;
    button.textContent =
        "Logging in...";

    try {

        const data = await api(
            "/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        if (!data.success) {

            setAuthMessage(
                data.message ||
                "Login failed.",
                "error"
            );

            return;
        }

        saveUser(
            data.user
        );

        await openApp();

    } catch (error) {

        setAuthMessage(
            error.message ||
            "Unable to connect to NEXORA.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent =
            "Login";
    }
}


/* ============================================================
   SIGNUP
   ============================================================ */

async function signup() {

    const name =
        $("signupName").value.trim();

    const email =
        $("signupEmail").value.trim();

    const password =
        $("signupPassword").value;

    if (!name) {

        setAuthMessage(
            "Please enter your name.",
            "error"
        );

        return;
    }

    if (!email) {

        setAuthMessage(
            "Please enter your email.",
            "error"
        );

        return;
    }

    if (password.length < 6) {

        setAuthMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    const button =
        $("signupBtn");

    button.disabled = true;
    button.textContent =
        "Creating...";

    try {

        const data = await api(
            "/signup",
            {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        if (!data.success) {

            setAuthMessage(
                data.message ||
                "Unable to create account.",
                "error"
            );

            return;
        }

        saveUser(
            data.user
        );

        await openApp();

    } catch (error) {

        setAuthMessage(
            error.message ||
            "Unable to connect to NEXORA.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent =
            "Sign Up";
    }
}


/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

async function requestPasswordReset() {

    const email =
        $("forgotEmail").value.trim();

    if (!email) {

        setAuthMessage(
            "Please enter the email connected to your NEXORA account.",
            "error"
        );

        return;
    }

    const button =
        $("forgotPasswordBtn");

    button.disabled = true;
    button.textContent =
        "Sending...";

    try {

        const data = await api(
            "/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({
                    email
                })
            }
        );

        setAuthMessage(
            data.message ||
            "If an account exists for that email, a reset link has been sent.",
            "success"
        );

        button.textContent =
            "Reset Link Sent";

    } catch (error) {

        setAuthMessage(
            error.message ||
            "Unable to send the reset link.",
            "error"
        );

        button.disabled = false;
        button.textContent =
            "Send Reset Link";
    }
}


/* ============================================================
   RESET PASSWORD
   ============================================================ */

async function resetPassword() {

    if (!resetToken) {

        setAuthMessage(
            "This password reset link is invalid.",
            "error"
        );

        return;
    }

    const password =
        $("resetPassword").value;

    const confirmPassword =
        $("resetPasswordConfirm").value;

    if (password.length < 6) {

        setAuthMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    if (password !== confirmPassword) {

        setAuthMessage(
            "Passwords do not match.",
            "error"
        );

        return;
    }

    const button =
        $("resetPasswordBtn");

    button.disabled = true;
    button.textContent =
        "Resetting...";

    try {

        const data = await api(
            "/reset-password",
            {
                method: "POST",
                body: JSON.stringify({
                    token: resetToken,
                    password,
                    confirm_password:
                        confirmPassword
                })
            }
        );

        if (!data.success) {

            setAuthMessage(
                data.message ||
                "Unable to reset password.",
                "error"
            );

            return;
        }

        resetToken = null;

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        showAuthScreen(
            "loginScreen"
        );

        $("loginPassword").value =
            "";

        setAuthMessage(
            "Password reset successfully. You can now log in with your new password.",
            "success"
        );

    } catch (error) {

        setAuthMessage(
            error.message ||
            "Unable to reset your password.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent =
            "Reset Password";
    }
}


/* ============================================================
   CHECK RESET LINK
   ============================================================ */

function checkResetLink() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const token =
        params.get(
            "reset_token"
        );

    if (!token) {
        return false;
    }

    resetToken = token;

    hide($("splashScreen"));
    show($("authScreen"));

    showAuthScreen(
        "resetPasswordScreen"
    );

    setAuthMessage(
        "Create a new password for your account."
    );

    return true;
}


/* ============================================================
   OPEN APP
   ============================================================ */

async function openApp() {

    hide($("authScreen"));
    show($("app"));

    updateProfileUI();

    await loadConversations();

    if (
        conversations.length > 0
    ) {

        await loadConversation(
            conversations[0].id
        );

    } else {

        createLocalWelcome();
    }
}


/* ============================================================
   PROFILE UI
   ============================================================ */

function updateProfileUI() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.name ||
        currentUser.email ||
        "User";

    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase();

    if ($("profileInitial")) {

        $("profileInitial")
            .textContent =
            initial || "U";
    }

    if ($("profileName")) {

        $("profileName")
            .value =
            currentUser.name || "";
    }

    if ($("profileEmail")) {

        $("profileEmail")
            .value =
            currentUser.email || "";
    }
}


/* ============================================================
   USER PAYLOAD
   ============================================================ */

function userPayload() {

    if (!currentUser) {
        return {};
    }

    return {
        email:
            currentUser.email,
        username:
            currentUser.username,
        user: currentUser
    };
}


/* ============================================================
   CONVERSATIONS
   ============================================================ */

async function loadConversations() {

    if (!currentUser) {
        return;
    }

    try {

        const query =
            new URLSearchParams({
                email:
                    currentUser.email
            });

        const data =
            await api(
                "/conversations?" +
                query.toString()
            );

        conversations =
            data.conversations ||
            [];

        renderConversations();

    } catch (error) {

        console.error(
            error
        );
    }
}


function renderConversations() {

    const list =
        $("conversationList");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (
        conversations.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.textContent =
            "No conversations yet.";

        empty.style.opacity =
            "0.6";

        empty.style.padding =
            "12px";

        list.appendChild(
            empty
        );

        return;
    }

    conversations.forEach(
        conversation => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "conversation-item";

            if (
                conversation.id ===
                currentConversationId
            ) {

                item.classList.add(
                    "active"
                );
            }

            const title =
                document.createElement(
                    "span"
                );

            title.textContent =
                conversation.title ||
                "New chat";

            item.appendChild(
                title
            );

            item.onclick =
                () => {

                    loadConversation(
                        conversation.id
                    );

                    closeDrawer();
                };

            list.appendChild(
                item
            );
        }
    );
}


/* ============================================================
   LOAD CONVERSATION
   ============================================================ */

async function loadConversation(
    id
) {

    if (!currentUser || !id) {
        return;
    }

    try {

        const query =
            new URLSearchParams({
                email:
                    currentUser.email
            });

        const data =
            await api(
                "/conversations/" +
                encodeURIComponent(id) +
                "?" +
                query.toString()
            );

        currentConversationId =
            data.conversation.id;

        renderMessages(
            data.messages || []
        );

        renderConversations();

    } catch (error) {

        console.error(
            error
        );
    }
}


/* ============================================================
   CREATE CONVERSATION
   ============================================================ */

async function createNewChat() {

    if (!currentUser) {
        return;
    }

    try {

        const data =
            await api(
                "/conversations/new",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...userPayload(),
                        title: "New chat"
                    })
                }
            );

        currentConversationId =
            data.conversation.id;

        conversations.unshift(
            data.conversation
        );

        renderConversations();
        renderMessages([]);

        showWelcome();

        closeDrawer();

    } catch (error) {

        console.error(
            error
        );
    }
}


/* ============================================================
   WELCOME
   ============================================================ */

function showWelcome() {

    show(
        $("welcomeScreen")
    );
}


function hideWelcome() {

    hide(
        $("welcomeScreen")
    );
}


function createLocalWelcome() {

    currentConversationId =
        null;

    renderMessages([]);

    showWelcome();
}


/* ============================================================
   RENDER MESSAGES
   ============================================================ */

function renderMessages(
    messages
) {

    const container =
        $("messages");

    container.innerHTML = "";

    if (
        !messages ||
        messages.length === 0
    ) {

        showWelcome();
        return;
    }

    hideWelcome();

    messages.forEach(
        message => {

            addMessageToUI(
                message.role,
                message.content,
                message.image_url
            );
        }
    );

    scrollToBottom();
}


/* ============================================================
   ADD MESSAGE
   ============================================================ */

function addMessageToUI(
    role,
    content,
    imageUrl = null
) {

    const container =
        $("messages");

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message " +
        (
            role === "user"
                ? "user-message"
                : "assistant-message"
        );

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    bubble.textContent =
        content || "";

    wrapper.appendChild(
        bubble
    );

    if (imageUrl) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            imageUrl;

        image.alt =
            "Generated image";

        image.style.maxWidth =
            "100%";

        image.style.borderRadius =
            "14px";

        image.style.marginTop =
            "10px";

        bubble.appendChild(
            image
        );
    }

    container.appendChild(
        wrapper
    );

    scrollToBottom();
}


/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function showTyping() {

    removeTyping();

    const container =
        $("messages");

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "nexoraTyping";

    wrapper.className =
        "message assistant-message";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    bubble.textContent =
        "NEXORA is thinking...";

    wrapper.appendChild(
        bubble
    );

    container.appendChild(
        wrapper
    );

    scrollToBottom();
}


function removeTyping() {

    const typing =
        $("nexoraTyping");

    if (typing) {
        typing.remove();
    }
}


/* ============================================================
   SEND MESSAGE
   ============================================================ */

async function sendMessage(
    customMessage = null
) {

    if (!currentUser) {
        return;
    }

    const input =
        $("messageInput");

    const message =
        customMessage !== null
            ? customMessage
            : input.value.trim();

    if (!message) {
        return;
    }

    input.value = "";

    input.style.height =
        "auto";

    hideWelcome();

    addMessageToUI(
        "user",
        message
    );

    showTyping();

    try {

        const payload = {
            ...userPayload(),
            message
        };

        if (
            currentConversationId
        ) {

            payload.conversation_id =
                currentConversationId;
        }

        const data =
            await api(
                "/chat",
                {
                    method: "POST",
                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        removeTyping();

        if (
            data.conversation_id
        ) {

            currentConversationId =
                data.conversation_id;
        }

        addMessageToUI(
            "assistant",
            data.reply ||
            data.response ||
            "I couldn't generate a response."
        );

        if (
            data.image_url
        ) {

            const messages =
                $("messages");

            const last =
                messages.lastElementChild;

            if (last) {

                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    data.image_url;

                image.style.maxWidth =
                    "100%";

                image.style.borderRadius =
                    "14px";

                last
                    .querySelector(
                        ".message-bubble"
                    )
                    ?.appendChild(
                        image
                    );
            }
        }

        await loadConversations();

    } catch (error) {

        removeTyping();

        addMessageToUI(
            "assistant",
            "Sorry, I couldn't connect to NEXORA right now."
        );

        console.error(
            error
        );
    }
}


/* ============================================================
   SCROLL
   ============================================================ */

function scrollToBottom() {

    const chat =
        $("chatContainer");

    if (!chat) {
        return;
    }

    requestAnimationFrame(
        () => {

            chat.scrollTop =
                chat.scrollHeight;
        }
    );
}


/* ============================================================
   DRAWER
   ============================================================ */

function openDrawer() {

    $("drawer")
        ?.classList
        .add("open");

    $("drawerOverlay")
        ?.classList
        .add("open");
}


function closeDrawer() {

    $("drawer")
        ?.classList
        .remove("open");

    $("drawerOverlay")
        ?.classList
        .remove("open");
}


/* ============================================================
   PROFILE
   ============================================================ */

async function openProfile() {

    if (!currentUser) {
        return;
    }

    try {

        const query =
            new URLSearchParams({
                email:
                    currentUser.email
            });

        const data =
            await api(
                "/profile?" +
                query.toString()
            );

        if (data.user) {

            currentUser =
                data.user;

            saveUser(
                currentUser
            );
        }

        updateProfileUI();

        show(
            $("profileModal")
        );

    } catch (error) {

        console.error(
            error
        );
    }
}


async function saveProfile() {

    const name =
        $("profileName")
            .value
            .trim();

    if (!name) {
        return;
    }

    try {

        const data =
            await api(
                "/profile",
                {
                    method: "POST",
                    body:
                        JSON.stringify({
                            ...userPayload(),
                            name
                        })
                }
            );

        if (data.user) {

            currentUser =
                data.user;

            saveUser(
                currentUser
            );

            updateProfileUI();
        }

        hide(
            $("profileModal")
        );

    } catch (error) {

        console.error(
            error
        );
    }
}


/* ============================================================
   MEMORY
   ============================================================ */

async function openMemory() {

    if (!currentUser) {
        return;
    }

    try {

        const query =
            new URLSearchParams({
                email:
                    currentUser.email
            });

        const data =
            await api(
                "/memory?" +
                query.toString()
            );

        const box =
            $("memoryContent");

        box.innerHTML = "";

        const memories =
            data.saved_memories ||
            [];

        if (
            memories.length === 0
        ) {

            box.textContent =
                "NEXORA has no saved memories yet.";

        } else {

            memories.forEach(
                memory => {

                    const item =
                        document.createElement(
                            "div"
                        );

                    item.textContent =
                        "• " + memory;

                    item.style.marginBottom =
                        "8px";

                    box.appendChild(
                        item
                    );
                }
            );
        }

        show(
            $("memoryModal")
        );

    } catch (error) {

        console.error(
            error
        );
    }
}


async function clearMemory() {

    if (!currentUser) {
        return;
    }

    try {

        await api(
            "/memory/clear",
            {
                method: "POST",
                body:
                    JSON.stringify(
                        userPayload()
                    )
            }
        );

        openMemory();

    } catch (error) {

        console.error(
            error
        );
    }
}


/* ============================================================
   RENAME
   ============================================================ */

function openRename(
    id
) {

    renameConversationId =
        id;

    $("renameConversationInput")
        .value = "";

    show(
        $("renameModal")
    );
}


async function saveConversationName() {

    const title =
        $("renameConversationInput")
            .value
            .trim();

    if (
        !title ||
        !renameConversationId
    ) {
        return;
    }

    try {

        await api(
            "/conversations/" +
            encodeURIComponent(
                renameConversationId
            ),
            {
                method: "PATCH",
                body:
                    JSON.stringify({
                        ...userPayload(),
                        title
                    })
            }
        );

        hide(
            $("renameModal")
        );

        await loadConversations();

    } catch (error) {

        console.error(
            error
        );
    }
}


/* ============================================================
   ACCOUNT SWITCH
   ============================================================ */

function switchAccount() {

    hide(
        $("app")
    );

    show(
        $("authScreen")
    );

    showAuthScreen(
        "loginScreen"
    );

    closeDrawer();
}


function switchToSignup() {

    hide(
        $("app")
    );

    show(
        $("authScreen")
    );

    showAuthScreen(
        "signupScreen"
    );

    closeDrawer();
}


/* ============================================================
   VOICE
   ============================================================ */

function voiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Voice input is not supported on this device."
        );

        return;
    }

    const recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-US";

    recognition.interimResults =
        false;

    recognition.maxAlternatives =
        1;

    recognition.onresult =
        (event) => {

            $("messageInput")
                .value =
                event.results[0][0]
                    .transcript;
        };

    recognition.start();
}


/* ============================================================
   EVENTS
   ============================================================ */

function setupEvents() {

    $("loginBtn")
        ?.addEventListener(
            "click",
            login
        );

    $("signupBtn")
        ?.addEventListener(
            "click",
            signup
        );

    $("showSignup")
        ?.addEventListener(
            "click",
            () => showAuthScreen(
                "signupScreen"
            )
        );

    $("showLogin")
        ?.addEventListener(
            "click",
            () => showAuthScreen(
                "loginScreen"
            )
        );

    $("showForgotPassword")
        ?.addEventListener(
            "click",
            () => {

                const loginEmail =
                    $("loginEmail")
                        .value
                        .trim();

                if (loginEmail) {

                    $("forgotEmail")
                        .value =
                        loginEmail;
                }

                showAuthScreen(
                    "forgotPasswordScreen"
                );
            }
        );

    $("backToLogin")
        ?.addEventListener(
            "click",
            () => showAuthScreen(
                "loginScreen"
            )
        );

    $("resetBackToLogin")
        ?.addEventListener(
            "click",
            () => showAuthScreen(
                "loginScreen"
            )
        );

    $("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            requestPasswordReset
        );

    $("resetPasswordBtn")
        ?.addEventListener(
            "click",
            resetPassword
        );

    $("menuBtn")
        ?.addEventListener(
            "click",
            openDrawer
        );

    $("closeDrawer")
        ?.addEventListener(
            "click",
            closeDrawer
        );

    $("drawerOverlay")
        ?.addEventListener(
            "click",
            closeDrawer
        );

    $("newChatBtn")
        ?.addEventListener(
            "click",
            createNewChat
        );

    $("sendBtn")
        ?.addEventListener(
            "click",
            () => sendMessage()
        );

    $("voiceBtn")
        ?.addEventListener(
            "click",
            voiceInput
        );

    $("messageInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                    && !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );

    $("messageInput")
        ?.addEventListener(
            "input",
            event => {

                event.target.style.height =
                    "auto";

                event.target.style.height =
                    Math.min(
                        event.target
                            .scrollHeight,
                        150
                    ) + "px";
            }
        );

    $("profileBtn")
        ?.addEventListener(
            "click",
            openProfile
        );

    $("topProfileBtn")
        ?.addEventListener(
            "click",
            openProfile
        );

    $("saveProfileBtn")
        ?.addEventListener(
            "click",
            saveProfile
        );

    $("memoryBtn")
        ?.addEventListener(
            "click",
            openMemory
        );

    $("clearMemoryBtn")
        ?.addEventListener(
            "click",
            clearMemory
        );

    $("switchAccountBtn")
        ?.addEventListener(
            "click",
            () => {

                hide(
                    $("app")
                );

                show(
                    $("authScreen")
                );

                showAuthScreen(
                    "loginScreen"
                );

                closeDrawer();
            }
        );

    $("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );

    $("closeProfileModal")
        ?.addEventListener(
            "click",
            () => hide(
                $("profileModal")
            )
        );

    $("closeMemoryModal")
        ?.addEventListener(
            "click",
            () => hide(
                $("memoryModal")
            )
        );

    $("closeRenameModal")
        ?.addEventListener(
            "click",
            () => hide(
                $("renameModal")
            )
        );

    $("closeAccountModal")
        ?.addEventListener(
            "click",
            () => hide(
                $("accountModal")
            )
        );

    $("saveConversationNameBtn")
        ?.addEventListener(
            "click",
            saveConversationName
        );

    $("accountLoginBtn")
        ?.addEventListener(
            "click",
            switchAccount
        );

    $("accountSignupBtn")
        ?.addEventListener(
            "click",
            switchToSignup
        );

    document
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        sendMessage(
                            button.textContent
                                .trim()
                        );
                    }
                );
            }
        );
}


/* ============================================================
   ENTER KEY AUTH
   ============================================================ */

function setupAuthEnterKeys() {

    $("loginPassword")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {
                    login();
                }
            }
        );

    $("signupPassword")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {
                    signup();
                }
            }
        );

    $("forgotEmail")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {
                    requestPasswordReset();
                }
            }
        );

    $("resetPasswordConfirm")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {
                    resetPassword();
                }
            }
        );
}


/* ============================================================
   STARTUP
   ============================================================ */

async function startNexora() {

    setupEvents();
    setupAuthEnterKeys();

    const hasResetLink =
        checkResetLink();

    if (hasResetLink) {
        return;
    }

    const savedUser =
        loadUser();

    if (savedUser) {

        currentUser =
            savedUser;

        hide(
            $("splashScreen")
        );

        await openApp();

        return;
    }

    setTimeout(
        () => {

            hide(
                $("splashScreen")
            );

            show(
                $("authScreen")
            );

            showAuthScreen(
                "loginScreen"
            );

        },
        900
    );
}


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    startNexora
);