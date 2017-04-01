<?php
/*
Plugin Name: A REST API Test Plugin
Plugin URI: http://kaklo.me
Description: Enables the Give it a REST API
Author: Mehul Kaklotar
Version: 0.1
Author URI: http://kaklo.me
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly
register_activation_hook( __FILE__, 'kaklo_activate' );
function kaklo_activate() {
	flush_rewrite_rules();
}

add_action( 'rest_api_init', 'dt_register_api_hooks' );
function dt_register_api_hooks() {
	$namespace = 'give-it-a-rest/v1';
	register_rest_route( $namespace, '/list-posts/', array(
		'methods'  => 'GET',
		'callback' => 'kaklo_get_posts',
	) );
	register_rest_route( $namespace, '/vote/', array(
		'methods'  => 'POST',
		'callback' => 'kaklo_process_vote',
	) );
}

function kaklo_get_posts() {
	if ( 0 || false === ( $return = get_transient( 'dt_all_posts' ) ) ) {
		$query     = apply_filters( 'kaklo_get_posts_query', array(
			'numberposts' => 10,
			'post_type'   => 'post',
			'post_status' => 'publish',
		) );
		$all_posts = get_posts( $query );
		$return    = array();
		foreach ( $all_posts as $post ) {
			$return[] = array(
				'ID'        => $post->ID,
				'title'     => $post->post_title,
				'permalink' => get_permalink( $post->ID ),
				'upvotes'   => intval( get_post_meta( $post->ID, 'kaklo_upvotes', true ) ),
				'downvotes' => intval( get_post_meta( $post->ID, 'kaklo_downvotes', true ) ),
			);
		}
		// cache for 10 minutes
		set_transient( 'kaklo_all_posts', $return, apply_filters( 'kaklo_posts_ttl', 60 * 10 ) );
	}
	$response = new WP_REST_Response( $return );
	$response->header( 'Access-Control-Allow-Origin', apply_filters( 'kaklo_access_control_allow_origin', '*' ) );

	return $response;
}

function kaklo_process_vote() {
	$vote    = $_POST['vote'];
	$post_id = $_POST['id'];
	// input validation
	if ( ! is_numeric( $post_id ) || ! in_array( strtolower( $vote ), array( 'up', 'down' ) ) ) {
		return false;
	}
	$meta_name      = 'kaklo_' . $vote . 'votes';
	$vote_count     = intval( get_post_meta( $post_id, $meta_name, true ) );
	$update_success = update_post_meta( $post_id, $meta_name, ++ $vote_count ) ? true : false;
	// clear transient posts cache
	delete_transient( 'kaklo_all_posts' );

	$response = new WP_REST_Response( $update_success );
	$response->header( 'Access-Control-Allow-Origin', apply_filters( 'kaklo_access_control_allow_origin', '*' ) );

	return $response;
}