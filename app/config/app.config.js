module.exports = {
    socketOptions: {
        origins: 'http://nations.godiagonal.com:* http://localhost:* http://127.0.0.1:*'
    },
    apiOptions: {
        origins: [
            'http://localhost:4200',
            'http://godiagonal.com',
            'http://nations.godiagonal.com'
        ]
    },
    defaultTimezone: 'Europe/Stockholm'
}