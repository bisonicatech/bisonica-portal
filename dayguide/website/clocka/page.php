<?php
/**
 * Ordinary pages, e.g. a privacy policy or contact page.
 */
get_header();
?>
<div class="page-content">
	<?php
	while ( have_posts() ) :
		the_post();
		?>
		<h1><?php the_title(); ?></h1>
		<?php the_content(); ?>
	<?php endwhile; ?>
</div>
<?php
get_footer();
