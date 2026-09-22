/* ============================================================
   NEXORA AI 13
   COMPLETE FRONTEND CONTROLLER
   MATCHED TO NEXORA AI VERSION 13 HTML + CSS
   DAVIDS DIGITALS LTD.©
   ============================================================ */

const API_BASE =
    "https://nexora-ai-1-r9y5.onrender.com";


/* ============================================================
   STATE
   ============================================================ */

let currentUser = null;
let currentConversationId = null;
let conversations = [];
let resetToken = null;
let renameConversationId = null;


/* ============================================================
   DOM HELPER
   ============================================================ */

const $ = (id) =>
    document.getElementById(id);


/* ============================================================
   DISPLAY HELPERS
   ============================================================ */

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

async function api(endpoint, options = {}) {

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

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Something went wrong."
            );
        }

        return data;

    } catch (error) {

        console.error(
            "NEXORA API Error:",
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

    const box =
        $("authMessage");

    if (!box) return;

    box.textContent =
        message || "";

    box.className =
        "auth-message " +
        type;
}


/* ============================================================
   AUTH SCREEN
   ============================================================ */

function showAuthScreen(screenId) {

    hide($("loginScreen"));
    hide($("signupScreen"));
    hide($("forgotPasswordScreen"));
    hide($("resetPasswordScreen"));

    show($(screenId));

    setAuthMessage("");
}


/* ============================================================
   SAVE USER
   ============================================================ */

function saveUser(user) {

    currentUser =
        user;

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

        return JSON.parse(saved);

    } catch (error) {

        console.error(error);

        return null;
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

        user:
            currentUser
    };
}


/* ============================================================
   LOGOUT
   ============================================================ */

function logout() {

    currentUser = null;
    currentConversationId = null;
    conversations = [];

    localStorage.removeItem(
        "nexora_user"
    );

    hide($("app"));

    show($("authScreen"));

    showAuthScreen(
        "loginScreen"
    );

    if ($("loginEmail")) {
        $("loginEmail").value = "";
    }

    if ($("loginPassword")) {
        $("loginPassword").value = "";
    }

    setAuthMessage("");
}


/* ============================================================
   LOGIN
   ============================================================ */

async function login() {

    const email =
        $("loginEmail")
            ?.value
            .trim();

    const password =
        $("loginPassword")
            ?.value || "";

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

    if (button) {

        button.disabled = true;
        button.textContent =
            "Logging in...";
    }

    try {

        const data =
            await api(
                "/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
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

        if (button) {

            button.disabled = false;
            button.textContent =
                "Login";
        }
    }
}


/* ============================================================
   SIGNUP
   ============================================================ */

async function signup() {

    const name =
        $("signupName")
            ?.value
            .trim();

    const email =
        $("signupEmail")
            ?.value
            .trim();

    const password =
        $("signupPassword")
            ?.value || "";

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

    if (button) {

        button.disabled = true;
        button.textContent =
            "Creating...";
    }

    try {

        const data =
            await api(
                "/signup",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
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

        if (button) {

            button.disabled = false;
            button.textContent =
                "Sign Up";
        }
    }
}


/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

async function requestPasswordReset() {

    const email =
        $("forgotEmail")
            ?.value
            .trim();

    if (!email) {

        setAuthMessage(
            "Please enter the email connected to your NEXORA account.",
            "error"
        );

        return;
    }

    const button =
        $("forgotPasswordBtn");

    if (button) {

        button.disabled = true;
        button.textContent =
            "Sending...";
    }

    try {

        const data =
            await api(
                "/forgot-password",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            email
                        })
                }
            );

        setAuthMessage(
            data.message ||
            "If an account exists for that email, a reset link has been sent.",
            "success"
        );

        if (button) {
            button.textContent =
                "Reset Link Sent";
        }

    } catch (error) {

        setAuthMessage(
            error.message ||
            "Unable to send the reset link.",
            "error"
        );

        if (button) {

            button.disabled = false;
            button.textContent =
                "Send Reset Link";
        }
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
        $("resetPassword")
            ?.value || "";

    const confirmPassword =
        $("resetPasswordConfirm")
            ?.value || "";

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

    if (button) {

        button.disabled = true;
        button.textContent =
            "Resetting...";
    }

    try {

        const data =
            await api(
                "/reset-password",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            token:
                                resetToken,

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

        if ($("loginPassword")) {
            $("loginPassword").value = "";
        }

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

        if (button) {

            button.disabled = false;
            button.textContent =
                "Reset Password";
        }
    }
}


/* ============================================================
   CHECK PASSWORD RESET LINK
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

    resetToken =
        token;

    hide(
        $("splashScreen")
    );

    show(
        $("authScreen")
    );

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

    hide(
        $("authScreen")
    );

    hide(
        $("splashScreen")
    );

    show(
        $("app")
    );

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
            "Conversation loading error:",
            error
        );
    }
}


/* ============================================================
   RENDER CONVERSATIONS
   ============================================================ */

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

        empty.className =
            "conversation-empty";

        empty.textContent =
            "No conversations yet.";

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


            /* Conversation button */

            const conversationButton =
                document.createElement(
                    "button"
                );

            conversationButton.type =
                "button";

            conversationButton.className =
                "conversation-button";


            const title =
                document.createElement(
                    "span"
                );

            title.className =
                "conversation-title";

            title.textContent =
                conversation.title ||
                "New chat";

            conversationButton.appendChild(
                title
            );


            conversationButton.addEventListener(
                "click",
                async () => {

                    await loadConversation(
                        conversation.id
                    );

                    closeDrawer();
                }
            );


            /* Rename button */

            const renameButton =
                document.createElement(
                    "button"
                );

            renameButton.type =
                "button";

            renameButton.className =
                "conversation-rename";

            renameButton.title =
                "Rename conversation";

            renameButton.textContent =
                "✎";


            renameButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openRename(
                        conversation.id,
                        conversation.title ||
                        ""
                    );
                }
            );


            item.appendChild(
                conversationButton
            );

            item.appendChild(
                renameButton
            );

            list.appendChild(
                item
            );
        }
    );
}


/* ============================================================
   LOAD CONVERSATION
   ============================================================ */

async function loadConversation(id) {

    if (
        !currentUser ||
        !id
    ) {
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

        if (
            !data.conversation
        ) {
            return;
        }

        currentConversationId =
            data.conversation.id;

        renderMessages(
            data.messages || []
        );

        renderConversations();

    } catch (error) {

        console.error(
            "Load conversation error:",
            error
        );
    }
}


/* ============================================================
   CREATE NEW CHAT
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

                    body:
                        JSON.stringify({
                            ...userPayload(),

                            title:
                                "New chat"
                        })
                }
            );

        if (
            !data.conversation
        ) {
            return;
        }

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
            "Create chat error:",
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

function renderMessages(messages) {

    const container =
        $("messages");

    if (!container) {
        return;
    }

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
   ADD MESSAGE TO UI
   MATCHES CSS:
   .message
   .message.user
   .message-avatar
   .message-content
   ============================================================ */

function addMessageToUI(
    role,
    content,
    imageUrl = null
) {

    const container =
        $("messages");

    if (!container) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message";

    if (
        role === "user"
    ) {

        wrapper.classList.add(
            "user"
        );
    }


    /* Avatar */

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";


    if (
        role === "user"
    ) {

        const name =
            currentUser?.name ||
            currentUser?.email ||
            "U";

        avatar.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "U";

    } else {

        avatar.textContent =
            "N";
    }


    /* Content */

    const contentBox =
        document.createElement(
            "div"
        );

    contentBox.className =
        "message-content";

    contentBox.textContent =
        content || "";


    /* Generated image */

    if (imageUrl) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            imageUrl;

        image.alt =
            "Generated image";

        image.style.display =
            "block";

        image.style.width =
            "100%";

        image.style.maxWidth =
            "100%";

        image.style.borderRadius =
            "14px";

        image.style.marginTop =
            content
                ? "10px"
                : "0";

        image.loading =
            "lazy";

        contentBox.appendChild(
            image
        );
    }


    /*
       User message:
       avatar goes after content
       so the bubble appears on the left
       and avatar on the right.
    */

    if (
        role === "user"
    ) {

        wrapper.appendChild(
            contentBox
        );

        wrapper.appendChild(
            avatar
        );

    } else {

        wrapper.appendChild(
            avatar
        );

        wrapper.appendChild(
            contentBox
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

    if (!container) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "nexoraTyping";

    wrapper.className =
        "message";


    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "N";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-content";

    bubble.textContent =
        "NEXORA is thinking...";


    wrapper.appendChild(
        avatar
    );

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

    if (!input) {
        return;
    }

    const message =
        customMessage !== null
            ? customMessage
            : input.value.trim();

    if (!message) {
        return;
    }


    /* Clear input */

    input.value =
        "";

    input.style.height =
        "auto";


    /* Hide welcome */

    hideWelcome();


    /* Show user message */

    addMessageToUI(
        "user",
        message
    );


    /* Typing */

    showTyping();


    try {

        const payload = {
            ...userPayload(),

            message:
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


        const reply =
            data.reply ||
            data.response ||
            "I couldn't generate a response.";


        addMessageToUI(
            "assistant",
            reply,
            data.image_url || null
        );


        await loadConversations();


        /*
           Keep the current conversation
           highlighted after refreshing list.
        */

        renderConversations();

    } catch (error) {

        removeTyping();

        addMessageToUI(
            "assistant",
            "Sorry, I couldn't connect to NEXORA right now."
        );

        console.error(
            "Send message error:",
            error
        );
    }
}


/* ============================================================
   SCROLL TO BOTTOM
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
            "Profile error:",
            error
        );
    }
}


/* ============================================================
   SAVE PROFILE
   ============================================================ */

async function saveProfile() {

    const input =
        $("profileName");

    if (!input) {
        return;
    }

    const name =
        input.value.trim();

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
            "Save profile error:",
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

        if (!box) {
            return;
        }

        box.innerHTML =
            "";

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
            "Memory error:",
            error
        );
    }
}


/* ============================================================
   CLEAR MEMORY
   ============================================================ */

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

        await openMemory();

    } catch (error) {

        console.error(
            "Clear memory error:",
            error
        );
    }
}


/* ============================================================
   RENAME CONVERSATION
   ============================================================ */

function openRename(
    id,
    currentTitle = ""
) {

    renameConversationId =
        id;

    const input =
        $("renameConversationInput");

    if (input) {

        input.value =
            currentTitle || "";

        setTimeout(
            () => {

                input.focus();

                input.select();

            },
            50
        );
    }

    show(
        $("renameModal")
    );
}


/* ============================================================
   SAVE CONVERSATION NAME
   ============================================================ */

async function saveConversationName() {

    const input =
        $("renameConversationInput");

    if (!input) {
        return;
    }

    const title =
        input.value.trim();

    if (
        !title ||
        !renameConversationId
    ) {
        return;
    }

    const button =
        $("saveConversationNameBtn");

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Saving...";
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

        renameConversationId =
            null;

        await loadConversations();

    } catch (error) {

        console.error(
            "Rename error:",
            error
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Name";
        }
    }
}


/* ============================================================
   ACCOUNT SWITCH
   ============================================================ */

function openAccountModal() {

    show(
        $("accountModal")
    );
}


function switchAccount() {

    hide(
        $("accountModal")
    );

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
        $("accountModal")
    );

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
   VOICE INPUT
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


    recognition.onstart =
        () => {

            const button =
                $("voiceBtn");

            if (button) {

                button.textContent =
                    "🔴";
            }
        };


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0]
                    .transcript;

            const input =
                $("messageInput");

            if (!input) {
                return;
            }

            input.value =
                transcript;

            input.style.height =
                "auto";

            input.style.height =
                Math.min(
                    input.scrollHeight,
                    150
                ) + "px";
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice recognition error:",
                error
            );
        };


    recognition.onend =
        () => {

            const button =
                $("voiceBtn");

            if (button) {

                button.textContent =
                    "🎤";
            }
        };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Voice start error:",
            error
        );
    }
}


/* ============================================================
   CLOSE MODALS WHEN CLICKING BACKGROUND
   ============================================================ */

function setupModalBackgrounds() {

    document
        .querySelectorAll(".modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            hide(
                                modal
                            );
                        }
                    }
                );
            }
        );
}


/* ============================================================
   EVENTS
   ============================================================ */

function setupEvents() {


    /* AUTH */

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
            () =>
                showAuthScreen(
                    "signupScreen"
                )
        );


    $("showLogin")
        ?.addEventListener(
            "click",
            () =>
                showAuthScreen(
                    "loginScreen"
                )
        );


    $("showForgotPassword")
        ?.addEventListener(
            "click",
            () => {

                const loginEmail =
                    $("loginEmail")
                        ?.value
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
            () =>
                showAuthScreen(
                    "loginScreen"
                )
        );


    $("resetBackToLogin")
        ?.addEventListener(
            "click",
            () =>
                showAuthScreen(
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


    /* DRAWER */

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


    /* CHAT */

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
                    event.key === "Enter" &&
                    !event.shiftKey
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
                        event.target.scrollHeight,
                        150
                    ) + "px";
            }
        );


    /* PROFILE */

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


    /* MEMORY */

    $("memoryBtn")
        ?.addEventListener(
            "click",
            async () => {

                closeDrawer();

                await openMemory();
            }
        );


    $("clearMemoryBtn")
        ?.addEventListener(
            "click",
            clearMemory
        );


    /* ACCOUNT */

    $("switchAccountBtn")
        ?.addEventListener(
            "click",
            () => {

                closeDrawer();

                openAccountModal();
            }
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


    /* LOGOUT */

    $("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    /* MODAL CLOSE BUTTONS */

    $("closeProfileModal")
        ?.addEventListener(
            "click",
            () =>
                hide(
                    $("profileModal")
                )
        );


    $("closeMemoryModal")
        ?.addEventListener(
            "click",
            () =>
                hide(
                    $("memoryModal")
                )
        );


    $("closeRenameModal")
        ?.addEventListener(
            "click",
            () => {

                renameConversationId =
                    null;

                hide(
                    $("renameModal")
                );
            }
        );


    $("closeAccountModal")
        ?.addEventListener(
            "click",
            () =>
                hide(
                    $("accountModal")
                )
        );


    /* RENAME */

    $("saveConversationNameBtn")
        ?.addEventListener(
            "click",
            saveConversationName
        );


    /* SUGGESTIONS */

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


    setupModalBackgrounds();
}


/* ============================================================
   AUTH ENTER KEYS
   ============================================================ */

function setupAuthEnterKeys() {


    $("loginPassword")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

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

                    event.preventDefault();

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

                    event.preventDefault();

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

                    event.preventDefault();

                    resetPassword();
                }
            }
        );


    $("renameConversationInput")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    saveConversationName();
                }
            }
        );
}


/* ============================================================
   START NEXORA
   ============================================================ */

async function startNexora() {

    setupEvents();

    setupAuthEnterKeys();


    /* Check password reset link */

    const hasResetLink =
        checkResetLink();

    if (hasResetLink) {
        return;
    }


    /* Check saved account */

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


    /* Show login after splash */

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