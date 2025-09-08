<?php
/**
 * Plugin Name: Design Tokens Loader
 */
function enqueue_design_tokens() {
    wp_enqueue_style( 'design-tokens', plugin_dir_url( __FILE__ ) . 'tokens.css' );
}
add_action( 'wp_enqueue_scripts', 'enqueue_design_tokens' );