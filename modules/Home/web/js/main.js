var contactSearchField = $('#contact_search');
var oldContactSearchVal = '';
var contactTemplate = '<li onclick="selectChat(this)" data-receiver-name="{r_name}" data-chat-id="{chat_id}">\n' +
    '                            <div class="d-flex bd-highlight">\n' +
    '                                <div class="img_cont">\n' +
    '                                    <img src="../img/no-avatar.png" class="rounded-circle user_img">\n' +
    '                                    <span class="online_icon"></span>\n' +
    '                                </div>\n' +
    '                                <div class="user_info">\n' +
    '                                    <span>{username}</span>\n' +
    '                                    <p>{status}</p>\n' +
    '                                </div>\n' +
    '                            </div>\n' +
    '                        </li>';
var sendMessageTemplate = '<div class="d-flex justify-content-end mb-4">\n' +
    '                        <div class="msg_cotainer_send">\n' +
    '                            {message}\n' +
    '                            <span class="msg_time_send">{time}</span>\n' +
    '                        </div>\n' +
    '                        <div class="img_cont_msg">\n' +
    '                            <img src="../img/no-avatar.png" class="rounded-circle user_img_msg">\n' +
    '                        </div>\n' +
    '                    </div>';
var getMessageTemplate = '<div class="d-flex justify-content-start mb-4">\n' +
    '                        <div class="img_cont_msg">\n' +
    '                            <img src="../img/no-avatar.png" class="rounded-circle user_img_msg">\n' +
    '                        </div>\n' +
    '                        <div class="msg_cotainer">\n' +
    '                            {message}\n' +
    '                            <span class="msg_time">{time}</span>\n' +
    '                        </div>\n' +
    '                    </div>';
var allUserChatsMessages = [];
var currentChatMessages = [];
var currUserId = null;
var chatChanged = false;

var currentChatId = null;
var currentReceiverName = null;
var msgInput = $('#msg');
var chatWithBlock = $('#chat_with');
var messagesBlock = $('#messages_block');

var contactsBlock = $('.contacts');

contactSearchField.keyup(function (ev) {
    let str = ev.target.value;
    if (str === oldContactSearchVal) return;

    oldContactSearchVal = str;

    searchContact(str);
});

function searchContact(str) {
    $.ajax({
        url: '/home/chat/find-chat',
        type: 'GET',
        data: {'UserSearch[username]': str},
        success: function (response) {
            if (response.success) {
                let data = response.data;
                contactsBlock.empty();
                for (let i = 0; i < data.length; i++) {
                    contactsBlock.append(contactTemplate
                        .replace('{username}', data[i].username)
                        .replace('{chat_id}', data[i].correspondence__id)
                        .replace('{r_name}', data[i].username));
                }
            }
        }
    });
}

function selectChat(el) {
    let chatId = $(el).attr('data-chat-id');

    currentReceiverName = $(el).attr('data-receiver-name');

    chatWithBlock[0].innerHTML = 'Chat with ' + currentReceiverName;

    chatChanged = true;
    if (chatId === 'null') {
        $('#messages_block').empty();
        currentChatId = null;
    } else {
        currentChatId = chatId;
        updateCurrentChat();
    }

    $('#select_msg').remove();
    $('#msg_block').removeClass('d-none');
    $('#msg_header').removeClass('d-none');
}

function sendMsg(msg) {
    let csrf = $('meta[name=csrf-token]').attr("content");

    $.ajax({
        url: '/home/chat/send-message',
        type: 'POST',
        data: {
            '_csrf': csrf,
            'receiverName': currentReceiverName,
            'CorrespondenceMessage[correspondence__id]': currentChatId,
            'CorrespondenceMessage[text]': msg,
        },
        success: function (response) {
            if (response.success) {
                if (response.data.correspondence__id) {
                    currentChatId = response.data.correspondence__id;
                }
                chatChanged = true;
                $('li[data-receiver-name="' + currentReceiverName + '"]').attr('data-chat-id', currentChatId);
            }
        }
    });
}

$('#send_msg').click(function () {
    sendMsg(msgInput.val());
    msgInput.val('');
});

msgInput.keydown(function (ev) {
    if (ev.keyCode === 13) {
        sendMsg(msgInput.val());
        msgInput.val('');
    }
});

function getAllUserChatsMessages() {
    $.ajax({
        url: '/home/chat/get-messages',
        type: 'GET',
        success: function (response) {
            if (response.success) {
                currUserId = response.current_user;
                allUserChatsMessages = response.data;
                updateCurrentChat();
            }
        }
    });
}

function updateCurrentChat() {
    if (currentChatId != null) {
        let currChat = [];
        let makeChange = false;
        let crcIndex = 0;

        for (let i = 0; i < allUserChatsMessages.length; i++) {
            if (allUserChatsMessages[i].correspondence__id == currentChatId) {
                currChat.push(allUserChatsMessages[i]);
                if (currentChatMessages[crcIndex] !== undefined) {
                    if (currChat[crcIndex].text !== currentChatMessages[crcIndex].text) {
                        makeChange = true;
                    }
                } else {
                    makeChange = true;
                }
                crcIndex++;
            }
        }

        if (makeChange || chatChanged) {
            chatChanged = false;
            currentChatMessages = currChat;


            console.log(currentChatMessages);
            messagesBlock.empty();

            for (let i = 0; i < currentChatMessages.length; i++) {
                if (currentChatMessages[i].user__id == currUserId) {
                    let tempCopy = sendMessageTemplate;
                    messagesBlock.append(
                        tempCopy
                            .replace('{message}', currentChatMessages[i].text)
                            .replace('{time}', currentChatMessages[i].time)
                    );
                } else {
                    let tempCopy = getMessageTemplate;
                    messagesBlock.append(
                        tempCopy
                            .replace('{message}', currentChatMessages[i].text)
                            .replace('{time}', currentChatMessages[i].time)
                    );
                }
            }
        }
    }
}

setInterval(function () {
    getAllUserChatsMessages();
}, 1000);

searchContact('');