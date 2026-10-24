<?php
/**
 * Clocka theme setup.
 *
 * Everything that changes often (store links, prices, story, contact email)
 * is under Appearance › Customize › Clocka.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function clocka_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'responsive-embeds' );
	register_nav_menus(
		array(
			'footer' => __( 'Footer links', 'clocka' ),
		)
	);
}
add_action( 'after_setup_theme', 'clocka_setup' );

function clocka_assets() {
	$ver = wp_get_theme()->get( 'Version' );
	wp_enqueue_style( 'clocka', get_stylesheet_uri(), array(), $ver );
}
add_action( 'wp_enqueue_scripts', 'clocka_assets' );

/** URL of a file in the theme's assets folder. */
function clocka_asset( $path ) {
	return esc_url( get_template_directory_uri() . '/assets/' . ltrim( $path, '/' ) );
}

/** Use the Clocka icon as the browser tab icon when no Site Icon has been set. */
function clocka_favicon() {
	if ( ! has_site_icon() ) {
		echo '<link rel="icon" href="' . clocka_asset( 'img/site-icon.png' ) . '" sizes="512x512">' . "\n";
		echo '<link rel="apple-touch-icon" href="' . clocka_asset( 'img/site-icon.png' ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'clocka_favicon' );

/** A short description for search engines on the home page. */
function clocka_meta_description() {
	if ( is_front_page() ) {
		echo '<meta name="description" content="' . esc_attr__( 'Clocka is a gentle day clock for people living with dementia. It shows the time, the part of the day and one simple thing to do now, and lets the family help from their own phones.', 'clocka' ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'clocka_meta_description', 1 );

/** Default settings. */
function clocka_defaults() {
	return array(
		'clocka_appstore_url' => '',
		'clocka_play_url'     => '',
		'clocka_price_month'  => '£2.99',
		'clocka_price_year'   => '£24.99',
		'clocka_trial'        => '1 month',
		'clocka_email'        => 'info@clocka.co.uk',
		'clocka_privacy_url'  => 'https://clocka.co.uk/clocka_privacy_privacy.html',
		'clocka_story'        => "Clocka started at 3 o'clock in the morning. My dad lives with dementia, and he would wake in the middle of the night, get dressed and start his day, while his wife was up with him, worn out. We wanted something simple that answered the question he kept asking: what should I be doing now?",
		'clocka_story_name'   => 'Jason Nicholls, founder of Clocka',
	);
}

/** A Customizer setting, falling back to the default. */
function clocka_mod( $key ) {
	$defaults = clocka_defaults();
	return get_theme_mod( $key, isset( $defaults[ $key ] ) ? $defaults[ $key ] : '' );
}

function clocka_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'clocka',
		array(
			'title'       => __( 'Clocka', 'clocka' ),
			'description' => __( 'Store links, prices and the founder\'s story. Leave a store link empty to show "Coming soon".', 'clocka' ),
			'priority'    => 30,
		)
	);
	$fields = array(
		'clocka_appstore_url' => array( __( 'App Store link (iPhone)', 'clocka' ), 'url' ),
		'clocka_play_url'     => array( __( 'Google Play link (Android)', 'clocka' ), 'url' ),
		'clocka_price_month'  => array( __( 'Premium price per month', 'clocka' ), 'text' ),
		'clocka_price_year'   => array( __( 'Premium price per year', 'clocka' ), 'text' ),
		'clocka_trial'        => array( __( 'Free trial length (e.g. 1 month)', 'clocka' ), 'text' ),
		'clocka_email'        => array( __( 'Contact email', 'clocka' ), 'email' ),
		'clocka_privacy_url'  => array( __( 'Privacy policy link', 'clocka' ), 'url' ),
		'clocka_story'        => array( __( 'Founder\'s story', 'clocka' ), 'textarea' ),
		'clocka_story_name'   => array( __( 'Story signed by', 'clocka' ), 'text' ),
	);
	$defaults = clocka_defaults();
	foreach ( $fields as $id => $field ) {
		$sanitize = 'url' === $field[1] ? 'esc_url_raw' : ( 'email' === $field[1] ? 'sanitize_email' : ( 'textarea' === $field[1] ? 'sanitize_textarea_field' : 'sanitize_text_field' ) );
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $defaults[ $id ],
				'sanitize_callback' => $sanitize,
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'   => $field[0],
				'section' => 'clocka',
				'type'    => $field[1],
			)
		);
	}
}
add_action( 'customize_register', 'clocka_customize_register' );

/** The App Store and Google Play buttons. A missing link shows "Coming soon". */
function clocka_store_buttons( $style = '' ) {
	$stores = array(
		array( clocka_mod( 'clocka_appstore_url' ), __( 'Download for', 'clocka' ), __( 'iPhone', 'clocka' ) ),
		array( clocka_mod( 'clocka_play_url' ), __( 'Get it for', 'clocka' ), __( 'Android', 'clocka' ) ),
	);
	echo '<div class="store-buttons">';
	foreach ( $stores as $store ) {
		list( $url, $small, $big ) = $store;
		if ( $url ) {
			printf(
				'<a class="btn store-btn %1$s" href="%2$s" rel="noopener"><small>%3$s</small><strong>%4$s</strong></a>',
				esc_attr( $style ),
				esc_url( $url ),
				esc_html( $small ),
				esc_html( $big )
			);
		} else {
			printf(
				'<span class="btn store-btn btn--disabled" aria-disabled="true"><small>%1$s</small><strong>%2$s</strong></span>',
				esc_html__( 'Coming soon for', 'clocka' ),
				esc_html( $big )
			);
		}
	}
	echo '</div>';
}
