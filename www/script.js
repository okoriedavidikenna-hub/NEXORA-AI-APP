/* ============================================================
   NEXORA AI 14 — WWW VERSION
   COMPLETE FRONTEND CONTROLLER
   USERNAME + PASSWORD AUTHENTICATION
   DAVIDS DIGITALS LTD.©
   ============================================================ */

const API_BASE =
    "https://nexora-ai-9jgj.onrender.com";


/* ============================================================
   STATE
============================================================ */

let currentUser = null;
let currentConversationId = null;
let conversations = [];
let renameConversationId = null;
let isSending = false;
let recognition = null;


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

        const response =
            await fetch(
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
        "auth-message " + type;
}


/* ============================================================
   AUTH SCREEN
============================================================ */

function showAuthScreen(screenId) {

    hide($("loginScreen"));
    hide($("signupScreen"));

    show($(screenId));

    setAuthMessage("");
}


/* ============================================================
   NORMALIZE USER
============================================================ */

function normalizeUser(data) {

    const user =
        data?.user ||
        data?.account ||
        data ||
        {};

    return {

        username:
            user.username ||
            user.name ||
            "",

        name:
            user.name ||
            user.username ||
            "",

        user_id:
            user.user_id ||
            user.id ||
            user.username ||
            ""
    };
}


/* ============================================================
   SAVE USER
============================================================ */

function saveUser(user) {

    currentUser =
        normalizeUser(user);

    localStorage.setItem(
        "nexora_user",
        JSON.stringify(currentUser)
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

        return normalizeUser(
            JSON.parse(saved)
        );

    } catch (error) {

        console.error(
            "Saved user error:",
            error
        );

        localStorage.removeItem(
            "nexora_user"
        );

        return null;
    }
}


/* ============================================================
   USERNAME
============================================================ */

function getUsername() {

    return (
        currentUser?.username ||
        currentUser?.name ||
        ""
    )
        .trim()
        .toLowerCase();
}


/* ============================================================
   USER PAYLOAD
============================================================ */

function userPayload() {

    if (!currentUser) {
        return {};
    }

    return {

        username:
            getUsername(),

        name:
            currentUser.name ||
            getUsername(),

        user:
            currentUser
    };
}


/* ============================================================
   USER QUERY
============================================================ */

function addUserQueryParams(params) {

    const username =
        getUsername();

    if (username) {

        params.set(
            "username",
            username
        );
    }

    return params;
}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {

    if (recognition) {

        try {
            recognition.stop();
        } catch (error) {
            console.warn(
                "Voice stop error:",
                error
            );
        }

        recognition = null;
    }

    currentUser = null;
    currentConversationId = null;
    conversations = [];
    renameConversationId = null;
    isSending = false;

    localStorage.removeItem(
        "nexora_user"
    );

    hide($("app"));

    show($("authScreen"));

    showAuthScreen(
        "loginScreen"
    );

    if ($("loginUsername")) {
        $("loginUsername").value = "";
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

    if (isSending) {
        return;
    }

    const username =
        $("loginUsername")
            ?.value
            .trim()
            .toLowerCase();

    const password =
        $("loginPassword")
            ?.value || "";

    if (!username) {

        setAuthMessage(
            "Please enter your username.",
            "error"
        );

        return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {

        setAuthMessage(
            "Username must be 3–30 characters and use only letters, numbers, or underscores.",
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
                            username,
                            password
                        })
                }
            );

        if (
            data.success === false
        ) {

            setAuthMessage(
                data.message ||
                "Login failed.",
                "error"
            );

            return;
        }

        const user =
            normalizeUser(
                data.user ||
                data.account ||
                data
            );

        if (!user.username) {

            setAuthMessage(
                "Login succeeded, but no user account was returned.",
                "error"
            );

            return;
        }

        saveUser(user);

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

    const username =
        $("signupUsername")
            ?.value
            .trim()
            .toLowerCase();

    const password =
        $("signupPassword")
            ?.value || "";

    const confirmPassword =
        $("signupPasswordConfirm")
            ?.value || "";

    if (!username) {

        setAuthMessage(
            "Please choose a username.",
            "error"
        );

        return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {

        setAuthMessage(
            "Username must be 3–30 characters and use only letters, numbers, or underscores.",
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

    if (password !== confirmPassword) {

        setAuthMessage(
            "Passwords do not match.",
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
                            username,
                            password,
                            confirm_password:
                                confirmPassword
                        })
                }
            );

        if (
            data.success === false
        ) {

            setAuthMessage(
                data.message ||
                "Unable to create account.",
                "error"
            );

            return;
        }

        const user =
            normalizeUser(
                data.user ||
                data.account ||
                data
            );

        if (!user.username) {

            setAuthMessage(
                "Account created, but no user account was returned.",
                "error"
            );

            return;
        }

        saveUser(user);

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
        currentUser.username ||
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
            currentUser.name ||
            currentUser.username ||
            "";
    }

    if ($("profileUsername")) {

        $("profileUsername")
            .value =
            currentUser.username ||
            "";
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
            addUserQueryParams(
                new URLSearchParams()
            );

        const data =
            await api(
                "/conversations?" +
                query.toString()
            );

        conversations =
            Array.isArray(
                data.conversations
            )
                ? data.conversations
                : [];

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
                String(conversation.id) ===
                String(currentConversationId)
            ) {

                item.classList.add(
                    "active"
                );
            }

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
            addUserQueryParams(
                new URLSearchParams()
            );

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

        conversations =
            conversations.filter(
                conversation =>
                    String(conversation.id) !==
                    String(data.conversation.id)
            );

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
   ADD MESSAGE
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
            currentUser?.username ||
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

    const contentBox =
        document.createElement(
            "div"
        );

    contentBox.className =
        "message-content";

    if (content) {

        const text =
            document.createElement(
                "div"
            );

        text.textContent =
            content;

        contentBox.appendChild(
            text
        );
    }

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

    if (
        !currentUser ||
        isSending
    ) {
        return;
    }

    const input =
        $("messageInput");

    if (!input) {
        return;
    }

    const message =
        customMessage !== null
            ? String(customMessage).trim()
            : input.value.trim();

    if (!message) {
        return;
    }

    isSending = true;

    const sendButton =
        $("sendBtn");

    if (sendButton) {
        sendButton.disabled = true;
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

        const reply =
            data.reply ||
            data.response ||
            "I couldn't generate a response.";

        addMessageToUI(
            "assistant",
            reply,
            data.image_url ||
            data.image ||
            null
        );

        await loadConversations();

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

    } finally {

        isSending = false;

        if (sendButton) {
            sendButton.disabled = false;
        }
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
            addUserQueryParams(
                new URLSearchParams()
            );

        const data =
            await api(
                "/profile?" +
                query.toString()
            );

        if (data.user) {

            currentUser =
                normalizeUser(
                    data.user
                );

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

    const button =
        $("saveProfileBtn");

    if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
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
                normalizeUser(
                    data.user
                );

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

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Save";
        }
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
            addUserQueryParams(
                new URLSearchParams()
            );

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

        box.innerHTML = "";

        const memories =
            data.saved_memories ||
            data.memories ||
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

                    const memoryText =
                        typeof memory === "string"
                            ? memory
                            : (
                                memory.text ||
                                memory.content ||
                                memory.memory ||
                                JSON.stringify(memory)
                            );

                    item.textContent =
                        "• " + memoryText;

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

    const button =
        $("clearMemoryBtn");

    if (button) {
        button.disabled = true;
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

    } finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* ============================================================
   RENAME
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

    /*
       Clear the locally saved account so the next
       person can log in with a different account.
    */

    localStorage.removeItem(
        "nexora_user"
    );

    currentUser = null;
    currentConversationId = null;
    conversations = [];

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

    localStorage.removeItem(
        "nexora_user"
    );

    currentUser = null;
    currentConversationId = null;
    conversations = [];

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


    /* Stop active recognition */

    if (recognition) {

        try {
            recognition.stop();
        } catch (error) {
            console.warn(
                "Voice stop error:",
                error
            );
        }

        recognition = null;

        return;
    }


    recognition =
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

            recognition = null;
        };


    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Voice start error:",
            error
        );

        recognition = null;
    }
}


/* ============================================================
   MODAL BACKGROUNDS
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
            () =>
                sendMessage()
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


    /* MODAL CLOSE */

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

    $("loginUsername")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    $("loginPassword")
                        ?.focus();
                }
            }
        );


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


    $("signupUsername")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    $("signupPassword")
                        ?.focus();
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

                    $("signupPasswordConfirm")
                        ?.focus();
                }
            }
        );


    $("signupPasswordConfirm")
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
   ESCAPE KEY
============================================================ */

function setupEscapeKey() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            hide(
                $("profileModal")
            );

            hide(
                $("memoryModal")
            );

            hide(
                $("renameModal")
            );

            hide(
                $("accountModal")
            );

            closeDrawer();

            renameConversationId =
                null;
        }
    );
}


/* ============================================================
   START NEXORA
============================================================ */

async function startNexora() {

    setupEvents();

    setupAuthEnterKeys();

    setupEscapeKey();

    const savedUser =
        loadUser();

    if (
        savedUser?.username
    ) {

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