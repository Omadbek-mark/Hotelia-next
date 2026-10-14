module.exports = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ru', 'uz'],
		localeDetection: false,
	},
	fallbackLng: 'en',
	defaultNS: 'common',
	keySeparator: false,
	resources: {
		en: { common: require('./public/locales/en/common.json') },
		ru: { common: require('./public/locales/ru/common.json') },
		uz: { common: require('./public/locales/uz/common.json') },
	},
	trailingSlash: true,
};
