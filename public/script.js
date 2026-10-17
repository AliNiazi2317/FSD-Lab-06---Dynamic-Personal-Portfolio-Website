
$(document).ready(function () {
    let portfolioData = {};
    let editingRecordId = null;

    $("#year").text(new Date().getFullYear());

    const sectionConfig = {
        skills: {
            title: "Skill",
            fields: [
                { name: "skill_name", label: "Skill Name", required: true },
                { name: "proficiency", label: "Proficiency (0-100)", type: "number" }
            ]
        },
        education: {
            title: "Education",
            fields: [
                { name: "institution", label: "Institution", required: true },
                { name: "degree", label: "Degree / Program" },
                { name: "start_year", label: "Start Year" },
                { name: "end_year", label: "End Year" },
                { name: "description", label: "Description", type: "textarea" }
            ]
        },
        experience: {
            title: "Experience",
            fields: [
                { name: "company", label: "Company / Organization", required: true },
                { name: "job_title", label: "Job Title" },
                { name: "start_date", label: "Start Date" },
                { name: "end_date", label: "End Date" },
                { name: "description", label: "Description", type: "textarea" }
            ]
        },
        projects: {
            title: "Project",
            fields: [
                { name: "project_name", label: "Project Name", required: true },
                { name: "description", label: "Description", type: "textarea" },
                { name: "technologies", label: "Technologies Used" },
                { name: "project_link", label: "Project Link", type: "url" }
            ]
        }
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function showMessage(message, isError = false) {
        $("#profileMessage")
            .text(message)
            .css("color", isError ? "#dc2626" : "#15803d");
    }

    function loadPortfolio() {
        $.ajax({
            url: "/api/portfolio",
            method: "GET",
            dataType: "json",
            success: function (data) {
                portfolioData = data;
                displayProfile(data.profile);
                displaySkills(data.skills || []);
                displayEducation(data.education || []);
                displayExperience(data.experience || []);
                displayProjects(data.projects || []);
                renderManageList();
            },
            error: function (xhr) {
                console.error(xhr.responseText);
                $("#heroAbout").text(
                    "Portfolio data could not be loaded. Please check the server and database."
                );
            }
        });
    }

    function displayProfile(profile) {
        if (!profile) {
            $("#heroName").text("Your Name");
            $("#heroTitle").text("Computer Science Student");
            $("#heroAbout, #aboutText").text(
                "Open Edit Portfolio to add your personal information."
            );
            $("#heroImage").attr(
                "src",
                "https://placehold.co/320x320/172554/ffffff?text=Your+Photo"
            );
            $("#emailText").text("Email not added");
            $("#phoneText").text("Phone not added");
            $("#locationText").text("Location not added");
            $("#footerName").text("My Portfolio");
            $("#contactEmail").attr("href", "mailto:");
            return;
        }

        $("#heroName").text(profile.full_name || "Your Name");
        $("#heroTitle").text(profile.title || "Portfolio");
        $("#heroAbout").text(profile.about || "Welcome to my portfolio.");
        $("#aboutText").text(profile.about || "No introduction added yet.");
        $("#emailText").text(profile.email || "Email not added");
        $("#phoneText").text(profile.phone || "Phone not added");
        $("#locationText").text(profile.location || "Location not added");
        $("#footerName").text(profile.full_name || "My Portfolio");

        const email = profile.email || "";
        $("#contactEmail").attr("href", email ? "mailto:" + email : "mailto:");

        $("#heroImage").attr(
            "src",
            profile.profile_image || 
            "https://placehold.co/320x320/172554/ffffff?text=Your+Photo"
        );
    }

    function displaySkills(skills) {
        const container = $("#skillsList");
        container.empty();

        if (!skills.length) {
            container.html('<p>No skills added yet. Use Edit Portfolio to add skills.</p>');
            return;
        }

        skills.forEach(function (skill) {
            const percentage = Math.max(
                0,
                Math.min(100, Number(skill.proficiency) || 0)
            );

            container.append(`
                <article class="item-card">
                    <h3>${escapeHTML(skill.skill_name)}</h3>
                    <p>${percentage}% proficiency</p>
                    <div class="skill-bar">
                        <span style="width:${percentage}%"></span>
                    </div>
                </article>
            `);
        });
    }

    function displayEducation(items) {
        const container = $("#educationList");
        container.empty();

        if (!items.length) {
            container.html('<p>No education details added yet.</p>');
            return;
        }

        items.forEach(function (item) {
            container.append(`
                <article class="item-card">
                    <h3>${escapeHTML(item.degree || "Education")}</h3>
                    <p><strong>${escapeHTML(item.institution)}</strong></p>
                    <p>${escapeHTML(item.start_year)} - ${escapeHTML(item.end_year)}</p>
                    <p>${escapeHTML(item.description)}</p>
                </article>
            `);
        });
    }

    function displayExperience(items) {
        const container = $("#experienceList");
        container.empty();

        if (!items.length) {
            container.html('<p>No experience details added yet.</p>');
            return;
        }

        items.forEach(function (item) {
            container.append(`
                <article class="item-card">
                    <h3>${escapeHTML(item.job_title || "Experience")}</h3>
                    <p><strong>${escapeHTML(item.company)}</strong></p>
                    <p>${escapeHTML(item.start_date)} - ${escapeHTML(item.end_date)}</p>
                    <p>${escapeHTML(item.description)}</p>
                </article>
            `);
        });
    }

    function displayProjects(items) {
        const container = $("#projectsList");
        container.empty();

        if (!items.length) {
            container.html('<p>No projects added yet.</p>');
            return;
        }

        items.forEach(function (item) {
            const link = safeProjectLink(item.project_link);

            container.append(`
                <article class="item-card">
                    <h3>${escapeHTML(item.project_name)}</h3>
                    <p>${escapeHTML(item.description)}</p>
                    <p><strong>Technologies:</strong> ${escapeHTML(item.technologies)}</p>
                    ${
                        link
                            ? `<p><a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">View Project ↗</a></p>`
                            : ""
                    }
                </article>
            `);
        });
    }

    function safeProjectLink(value) {
        try {
            const url = new URL(value);
            if (url.protocol === "http:" || url.protocol === "https:") {
                return url.href;
            }
        } catch (error) {
            return "";
        }
        return "";
    }

    function openEditor() {
        $("#editorModal").fadeIn(150);
        $("#profileMessage").text("");
        loadPortfolio();
    }

    $("#editBtn").on("click", openEditor);

    $("#closeModal").on("click", function () {
        $("#editorModal").fadeOut(150);
    });

    $("#editorModal").on("click", function (event) {
        if (event.target === this) {
            $(this).fadeOut(150);
        }
    });

    // Fill profile form with saved data.
    function fillProfileForm(profile) {
        const form = $("#profileForm")[0];
        form.reset();

        if (!profile) return;

        Object.keys(profile).forEach(function (key) {
            const field = form.elements.namedItem(key);

            // Never set a file input programmatically.
            if (field && field.type !== "file") {
                field.value = profile[key] ?? "";
            }
        });
    }

    $("#editBtn").on("click", function () {
        fillProfileForm(portfolioData.profile);
    });

    $("#profileForm").on("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            url: "/api/profile",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                showMessage(response.message);
                loadPortfolio();
            },
            error: function (xhr) {
                showMessage(
                    xhr.responseJSON?.message || "Profile could not be saved.",
                    true
                );
            }
        });
    });

    function renderRecordForm() {
        const section = $("#sectionSelect").val();
        const config = sectionConfig[section];

        editingRecordId = null;

        let html = `<h3 id="recordFormTitle">Add ${config.title}</h3>`;
        html += `<form id="recordForm">`;

        config.fields.forEach(function (field) {
            const required = field.required ? "required" : "";
            const type = field.type || "text";

            html += `<label for="field_${field.name}">${field.label}</label>`;

            if (type === "textarea") {
                html += `<textarea id="field_${field.name}" name="${field.name}" rows="3" ${required}></textarea>`;
            } else {
                html += `<input id="field_${field.name}" name="${field.name}" type="${type}" ${required} ${type === "number" ? 'min="0" max="100"' : ""}>`;
            }
        });

        html += `
            <button type="submit" class="btn">Save Record</button>
            <button type="button" id="cancelEdit" class="small-btn">Clear Form</button>
        </form>
        <p id="recordMessage" class="message"></p>`;

        $("#recordFormArea").html(html);
    }

    function renderManageList() {
        const section = $("#sectionSelect").val();
        const records = portfolioData[section] || [];
        const container = $("#manageList");

        container.empty();

        if (!records.length) {
            container.html("<p>No records available yet.</p>");
            return;
        }

        records.forEach(function (record) {
            const config = sectionConfig[section];
            const labelField = config.fields[0].name;
            const label = record[labelField] || config.title;

            container.append(`
                <div class="record-row">
                    <span>${escapeHTML(label)}</span>
                    <div class="record-actions">
                        <button type="button" class="small-btn edit-record" data-id="${Number(record.id)}">Edit</button>
                        <button type="button" class="small-btn delete-record" data-id="${Number(record.id)}">Delete</button>
                    </div>
                </div>
            `);
        });
    }

    $("#sectionSelect").on("change", function () {
        renderRecordForm();
        renderManageList();
    });

    $("#recordFormArea").on("submit", "#recordForm", function (event) {
        event.preventDefault();

        const section = $("#sectionSelect").val();
        const record = {};

        $(this).serializeArray().forEach(function (item) {
            record[item.name] = item.value;
        });

        if (editingRecordId !== null) {
            record.id = editingRecordId;
        }

        $.ajax({
            url: "/api/" + section,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(record),
            success: function (response) {
                $("#recordMessage").text(response.message).css("color", "#15803d");
                editingRecordId = null;
                loadPortfolio();
                renderRecordForm();
            },
            error: function (xhr) {
                $("#recordMessage")
                    .text(xhr.responseJSON?.message || "Could not save record.")
                    .css("color", "#dc2626");
            }
        });
    });

    $("#recordFormArea").on("click", "#cancelEdit", function () {
        editingRecordId = null;
        renderRecordForm();
    });

    $("#manageList").on("click", ".edit-record", function () {
        const id = Number($(this).attr("data-id"));
        const section = $("#sectionSelect").val();
        const record = (portfolioData[section] || []).find(function (item) {
            return Number(item.id) === id;
        });

        if (!record) return;

        editingRecordId = id;
        renderRecordForm();

        editingRecordId = id;
        $("#recordFormTitle").text("Edit " + sectionConfig[section].title);

        Object.keys(record).forEach(function (key) {
            $("#recordForm [name='" + key + "']").val(record[key] ?? "");
        });

        $("#recordFormArea")[0].scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    $("#manageList").on("click", ".delete-record", function () {
        const id = Number($(this).attr("data-id"));
        const section = $("#sectionSelect").val();

        if (!confirm("Are you sure you want to delete this record?")) {
            return;
        }

        $.ajax({
            url: "/api/" + section + "/" + id,
            method: "DELETE",
            success: function (response) {
                alert(response.message);
                loadPortfolio();
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.message || "Could not delete record.");
            }
        });
    });

    renderRecordForm();
    loadPortfolio();
});
