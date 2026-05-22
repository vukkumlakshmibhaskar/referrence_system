// User Verification Badges
file_content = file_content.replace(/<Badge bg="success" className="bg-opacity-25 text-success border border-success border-opacity-25">/g, '<Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">');
file_content = file_content.replace(/<Badge bg="secondary" className="bg-opacity-25 text-light border border-light border-opacity-25">/g, '<Badge bg="secondary" className="custom-badge bg-opacity-25 text-light border border-light border-opacity-25">');

// Partner Referral Code Badges
file_content = file_content.replace(/<Badge bg="primary" className="font-monospace px-2 py-1 shadow-sm">/g, '<Badge bg="primary" className="custom-badge font-monospace shadow-sm">');

// Partner Verification Badges
file_content = file_content.replace(/<Badge bg="success" className="bg-opacity-25 text-success border border-success border-opacity-25">/g, '<Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">');
file_content = file_content.replace(/<Badge bg="secondary" className="bg-opacity-25 text-light border border-light border-opacity-25">/g, '<Badge bg="secondary" className="custom-badge bg-opacity-25 text-light border border-light border-opacity-25">');

// Referral Code Student Count Badges
file_content = file_content.replace(/<Badge pill bg={rc.student_count > 0 \? 'primary' : 'secondary'} className="bg-opacity-25 text-light border border-light border-opacity-25">/g, '<Badge pill bg={rc.student_count > 0 ? 'primary' : 'secondary'} className="custom-badge bg-opacity-25 text-light border border-light border-opacity-25">');

// Referral Code Active Status Badges
file_content = file_content.replace(/<Badge bg="success" className="bg-opacity-25 text-success border border-success border-opacity-25">/g, '<Badge bg="success" className="custom-badge bg-opacity-25 text-success border border-success border-opacity-25">');
file_content = file_content.replace(/<Badge bg="danger" className="bg-opacity-25 text-danger border border-danger border-opacity-25">/g, '<Badge bg="danger" className="custom-badge bg-opacity-25 text-danger border border-danger border-opacity-25">');

// Referral Code Value Badges (clickable)
file_content = file_content.replace(/<Badge bg="info" className="font-monospace text-uppercase p-2 shadow-sm pointer-cursor me-2">/g, '<Badge bg="info" className="custom-badge font-monospace text-uppercase shadow-sm pointer-cursor me-2">');

// Finally, write the modified content back to the file
write_file(file_path='src/app/admin/page.jsx', content=file_content);