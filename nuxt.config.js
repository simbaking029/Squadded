export default {
	mode: 'spa',
	/*
	** Headers of the page
	*/
	head: {
		titleTemplate: '%s - ' + process.env.npm_package_name,
		title: process.env.npm_package_name || '',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ hid: 'description', name: 'description', content: process.env.npm_package_description || '' },
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
			{
				rel: 'stylesheet',
				href:
					'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons',
			},
		],
	},
	/*
	** Customize the progress-bar color
	*/
	loading: { color: '#fff' },
	/*
	** Global CSS
	*/
	css: [
		'~/assets/style/app.styl',
	],
	router: {
		middleware: 'i18n',
	},
	/*
	** Plugins to load before mounting the App
	*/
	plugins: [
		'@plugins/i18n.js',
		'@plugins/vuetify',
		'@plugins/messaging',
	],
	/*
	** Nuxt.js modules
	*/
	modules: [
		'@nuxtjs/vuetify',
		'@nuxtjs/pwa',
		'@nuxtjs/eslint-module',
	],
	/*
	** Build configuration
	*/
	build: {
		/*
		** You can extend webpack config here
		*/
		extend(config, ctx) {
		},
	},
	generate: {
		routes: ['/', '/feed'],
	},
};
